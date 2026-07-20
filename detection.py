# detectionTimesformer.py
# TimeSformer Real-Time CCTV Violence Detection + MERN Integration
###THIS ONE WORKED IN LIVE-SENDING To be used for presentation
import os
import cv2
import time
import torch
import threading
import requests
import numpy as np

from collections import deque
from datetime import datetime
from transformers import TimesformerForVideoClassification

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
NUM_FRAMES = 16
IMG_SIZE = 112

MEAN = np.array([0.45, 0.45, 0.45])
STD  = np.array([0.225, 0.225, 0.225])

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MODEL_PTH = r"C:\Users\PMLS\Downloads\Model 4 results\checkpoints\checkpoint_epoch_004.pth"

CLASS_NAMES = ["NonViolence", "Violence"]

# TimeSformer inference settings
PROCESS_EVERY = 8
BUFFER_SIZE   = 48

# Detection settings
VIOLENCE_THRESHOLD = 0.75
SMOOTH_WINDOW      = 6
CONSECUTIVE_CLIPS  = 2
COOLDOWN_SECS      = 10

# Incident recording
ROLLING_SECS = 5
INCIDENTS_DIR = "incidents"

os.makedirs(INCIDENTS_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────
# API CONFIG
# ─────────────────────────────────────────────────────────────
API_BASE     = "https://fydp-2022f-surveillance-system-deployed-production.up.railway.app"
API_USERNAME = "admin@cctv.com"
API_PASSWORD = "admin1234"

API_TOKEN = None

# ─────────────────────────────────────────────────────────────
# API LOGIN
# ─────────────────────────────────────────────────────────────
def get_token() -> str:
    try:
        response = requests.post(
            f"{API_BASE}/api/auth/login",
            json={
                "email": API_USERNAME,
                "password": API_PASSWORD,
            },
            timeout=5,
        )

        data = response.json()

        if data.get("success"):
            print("  [API] Logged in successfully.")
            return data["token"]

        print(f"  [API] Login failed: {data.get('error')}")
        return None

    except Exception as e:
        print(f"  [API] Login error: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# POST INCIDENT TO API
# ─────────────────────────────────────────────────────────────
def post_incident_to_api(camera_id: str,
                         probability: float,
                         video_path: str,
                         image_path: str) -> None:

    global API_TOKEN

    if not API_TOKEN:
        API_TOKEN = get_token()

    try:
        with open(video_path, "rb") as vf, open(image_path, "rb") as img_f:

            files = {
                "video": (
                    os.path.basename(video_path),
                    vf,
                    "video/mp4"
                ),
                "image": (
                    os.path.basename(image_path),
                    img_f,
                    "image/jpeg"
                ),
            }

            data = {
                "camera_id": camera_id,
                "probability": str(round(float(probability), 4)),
            }

            response = requests.post(
                f"{API_BASE}/api/incidents",
                files=files,
                data=data,
                headers={
                    "Authorization": f"Bearer {API_TOKEN}"
                },
                timeout=60,
            )

        # Retry if token expired
        if response.status_code == 401:

            print("  [API] Token expired. Refreshing...")

            API_TOKEN = get_token()

            if API_TOKEN:

                with open(video_path, "rb") as vf, open(image_path, "rb") as img_f:

                    files = {
                        "video": (
                            os.path.basename(video_path),
                            vf,
                            "video/mp4"
                        ),
                        "image": (
                            os.path.basename(image_path),
                            img_f,
                            "image/jpeg"
                        ),
                    }

                    response = requests.post(
                        f"{API_BASE}/api/incidents",
                        files=files,
                        data=data,
                        headers={
                            "Authorization": f"Bearer {API_TOKEN}"
                        },
                        timeout=60,
                    )

        print(f"  [API] Response: {response.status_code} — {response.json()}")

    except Exception as e:
        print(f"  [API] Failed to post incident: {e}")


# ─────────────────────────────────────────────────────────────
# SAVE INCIDENT
# ─────────────────────────────────────────────────────────────
_saving_lock = threading.Lock()

def save_incident(rolling_buffer,
                  fps,
                  frame_size,
                  violence_prob):

    if not _saving_lock.acquire(blocking=False):
        print("  [SAVE] Already saving...")
        return

    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        video_path = os.path.join(
            INCIDENTS_DIR,
            f"incident_{timestamp}.mp4"
        )

        snap_path = os.path.join(
            INCIDENTS_DIR,
            f"snapshot_{timestamp}.jpg"
        )

        # Save Video
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")

        writer = cv2.VideoWriter(
            video_path,
            fourcc,
            fps,
            frame_size
        )

        frames = [f for f, _ in rolling_buffer]

        for f in frames:
            writer.write(f)

        writer.release()

        # Save Snapshot
        if frames:
            snapshot = frames[-1].copy()

            ts_text = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            cv2.putText(
                snapshot,
                f"VIOLENCE DETECTED | {ts_text}",
                (10, snapshot.shape[0] - 15),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2,
                cv2.LINE_AA
            )

            cv2.imwrite(snap_path, snapshot)

        print(f"  [SAVED] {video_path}")
        print(f"  [SAVED] {snap_path}")

        # Upload in background
        def upload():
            post_incident_to_api(
                camera_id="CAM_01",
                probability=float(violence_prob),
                video_path=video_path,
                image_path=snap_path,
            )

            _saving_lock.release()

        threading.Thread(
            target=upload,
            daemon=True
        ).start()

    except Exception as e:
        print(f"  [SAVE] Error: {e}")
        _saving_lock.release()


# ─────────────────────────────────────────────────────────────
# ALERT STATE
# ─────────────────────────────────────────────────────────────
class AlertState:

    def __init__(self,
                 required_streak,
                 cooldown):

        self.required_streak = required_streak
        self.cooldown = cooldown

        self._streak = 0
        self._last_alert_ts = 0.0

    def update(self, is_violence):

        now = time.monotonic()

        if not is_violence:
            self._streak = 0
            return False

        if now - self._last_alert_ts < self.cooldown:
            self._streak = 0
            return False

        self._streak += 1

        if self._streak >= self.required_streak:

            self._streak = 0
            self._last_alert_ts = now

            return True

        return False

    @property
    def in_cooldown(self):

        return (
            time.monotonic() - self._last_alert_ts
        ) < self.cooldown

    @property
    def cooldown_remaining(self):

        return max(
            0.0,
            self.cooldown -
            (time.monotonic() - self._last_alert_ts)
        )


# ─────────────────────────────────────────────────────────────
# LOAD TIMESFORMER MODEL
# ─────────────────────────────────────────────────────────────
print("Loading TimeSformer model...")

model = TimesformerForVideoClassification.from_pretrained(
    "facebook/timesformer-base-finetuned-k400",
    num_labels=len(CLASS_NAMES),
    ignore_mismatched_sizes=True
)

checkpoint = torch.load(MODEL_PTH, map_location="cpu")

model.load_state_dict(
    checkpoint["model_state_dict"],
    strict=False
)

model.to(DEVICE)
model.eval()

print(f"Model loaded on {DEVICE}")


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
def main():

    global API_TOKEN

    API_TOKEN = get_token()

    alert_state = AlertState(
        required_streak=CONSECUTIVE_CLIPS,
        cooldown=COOLDOWN_SECS
    )

    # TimeSformer frame buffer
    frame_buffer = deque(maxlen=BUFFER_SIZE)

    # Probability smoothing
    pred_buffer = deque(maxlen=SMOOTH_WINDOW)

    # Raw frames for incident saving
    rolling_buffer = deque()

    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 720)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

    if not cap.isOpened():
        print("Camera not opened")
        return

    frame_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    frame_size = (frame_w, frame_h)

    fps = cap.get(cv2.CAP_PROP_FPS)

    if fps <= 1:
        fps = 25.0

    print("\nCCTV Started | Press Q to quit\n")

    frame_count = 0

    last_prediction = "Waiting..."
    last_probs = [0.5, 0.5]

    while True:

        ret, frame = cap.read()

        if not ret:
            break

        frame_count += 1

        display_frame = frame.copy()

        # ─────────────────────────────────────────────
        # Rolling buffer for incident saving
        # ─────────────────────────────────────────────
        rolling_capacity = int(fps * ROLLING_SECS)

        rolling_buffer.append(
            (frame.copy(), time.monotonic())
        )

        while len(rolling_buffer) > rolling_capacity:
            rolling_buffer.popleft()

        # ─────────────────────────────────────────────
        # PREPROCESS
        # ─────────────────────────────────────────────
        rgb_frame = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        resized = cv2.resize(
            rgb_frame,
            (IMG_SIZE, IMG_SIZE)
        )

        normalized = resized.astype(np.float32) / 255.0

        normalized = (normalized - MEAN) / STD

        frame_buffer.append(normalized)

        # ─────────────────────────────────────────────
        # OFFLINE-STYLE TIMESFORMER INFERENCE
        # ─────────────────────────────────────────────
        if (
            len(frame_buffer) == BUFFER_SIZE
            and
            frame_count % PROCESS_EVERY == 0
        ):

            indices = np.linspace(
                0,
                len(frame_buffer) - 1,
                NUM_FRAMES,
                dtype=int
            )

            selected_frames = [
                frame_buffer[i]
                for i in indices
            ]

            frames = np.stack(selected_frames)

            tensor = torch.from_numpy(frames).float()

            tensor = tensor.permute(
                0, 3, 1, 2
            ).unsqueeze(0).to(DEVICE)

            with torch.no_grad():

                outputs = model(tensor)

                probs = torch.softmax(
                    outputs.logits,
                    dim=1
                )[0]

                probs_np = probs.cpu().numpy()

                pred_buffer.append(probs_np)

                avg_probs = np.mean(
                    pred_buffer,
                    axis=0
                )

                pred_idx = np.argmax(avg_probs)

                last_prediction = CLASS_NAMES[pred_idx]

                last_probs = [
                    round(float(avg_probs[0]), 4),
                    round(float(avg_probs[1]), 4)
                ]

                is_violence = (
                    last_prediction == "Violence"
                    and
                    avg_probs[1] >= VIOLENCE_THRESHOLD
                )

                alert_active = alert_state.update(is_violence)

                # ─────────────────────────────────
                # SAVE INCIDENT
                # ─────────────────────────────────
                if alert_active:

                    print(
                        f"\n[ALERT] Violence detected "
                        f"| Conf={avg_probs[1]:.3f}"
                    )

                    save_incident(
                        rolling_buffer=rolling_buffer,
                        fps=fps,
                        frame_size=frame_size,
                        violence_prob=avg_probs[1]
                    )

        # ─────────────────────────────────────────────
        # DISPLAY
        # ─────────────────────────────────────────────
        color = (
            (0, 255, 0)
            if last_prediction == "NonViolence"
            else (0, 0, 255)
        )

        cv2.putText(
            display_frame,
            f"Pred: {last_prediction}",
            (20, 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            1.2,
            color,
            3
        )

        cv2.putText(
            display_frame,
            f"Non-Vio: {last_probs[0]:.3f} | "
            f"Vio: {last_probs[1]:.3f}",
            (20, 90),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

        # Cooldown display
        if alert_state.in_cooldown:

            cv2.putText(
                display_frame,
                f"Cooldown: "
                f"{alert_state.cooldown_remaining:.1f}s",
                (20, 130),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (0, 165, 255),
                2
            )

        cv2.imshow(
            "TimeSformer CCTV Detection",
            display_frame
        )

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


# ─────────────────────────────────────────────────────────────
# ENTRY
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    main()

