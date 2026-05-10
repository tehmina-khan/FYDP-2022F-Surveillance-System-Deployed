import cv2
import time
import torch
import torch.nn as nn
import numpy as np
import os
from collections import deque
from datetime import datetime
from torchvision.models.video import r3d_18
import requests  # add this to your existing imports at the top

def post_incident_to_api(camera_id: str, probability: float,
                          video_path: str, image_path: str) -> None:
    try:
        response = requests.post(
            "https://fydp-2022f-surveillance-system-deployed-production.up.railway.app/api/incidents",
            json={
                "camera_id":   camera_id,
                "probability": round(float(probability), 4),  # ← float() wraps numpy float32
                "video_url":   video_path,
                "image_url":   image_path,
            },
            headers={
                "Authorization": f"Bearer {API_TOKEN}"
            },
            timeout=3,
        )
        print(f"  [API] Response: {response.status_code} — {response.json()}")
    except Exception as e:
        print(f"  [API] Failed to post incident: {e}")

# ── Configuration ─────────────────────────────────────────────────────────────
MODEL_PATH        = r"D:\FYP-Integration\best_model.pth"
DEVICE            = torch.device("cuda" if torch.cuda.is_available() else "cpu")

NUM_FRAMES        = 24
IMG_SIZE          = 112
CLASS_NAMES       = ["NonViolence", "Violence"]

MOTION_THRESHOLD  = 0.02        # below this → "No Activity", skip inference
HIGH_MOTION       = 0.08        # above this → eligible for violence label
VIOLENCE_THRESHOLD = 0.6        # minimum violence prob to trigger alert

SMOOTH_WINDOW     = 8           # pred_buffer size for probability smoothing
CONSECUTIVE_CLIPS = 2           # confirmed violence clips needed for alert
COOLDOWN_SECS     = 15           # seconds between alerts
ROLLING_SECS      = 5           # seconds of footage kept for clip saving
INCIDENTS_DIR     = "incidents"

os.makedirs(INCIDENTS_DIR, exist_ok=True)

# ── Add this near your config ──────────────────────────────────────────────
import threading
_saving_lock = threading.Lock()

def save_incident(rolling_buffer, fps, frame_size, avg_probs):
    if not _saving_lock.acquire(blocking=False):
        print("  [SAVE] Skipped — save already in progress")
        return

    try:
        timestamp  = datetime.now().strftime("%Y%m%d_%H%M%S")
        video_path = os.path.join(INCIDENTS_DIR, f"incident_{timestamp}.mp4")  # ← mp4
        snap_path  = os.path.join(INCIDENTS_DIR, f"snapshot_{timestamp}.jpg")

        # ── Save video as mp4 ──────────────────────────────────────────────
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")                               # ← mp4v
        writer = cv2.VideoWriter(video_path, fourcc, fps, frame_size)
        frames = [f for f, _ in rolling_buffer]
        for f in frames:
            writer.write(f)
        writer.release()

        # ── Save snapshot ──────────────────────────────────────────────────
        if frames:
            snapshot = frames[-1].copy()
            ts_text  = datetime.now().strftime("%Y-%m-%d  %H:%M:%S")
            cv2.putText(snapshot, f"VIOLENCE DETECTED  |  {ts_text}",
                        (10, snapshot.shape[0] - 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 1, cv2.LINE_AA)
            cv2.imwrite(snap_path, snapshot)

        # ── Wait until fully written ───────────────────────────────────────
        import time
        for _ in range(20):
            if os.path.exists(video_path) and os.path.getsize(video_path) > 0:
                break
            time.sleep(0.5)

        print(f"  [SAVED] clip     -> {video_path} ({os.path.getsize(video_path)} bytes)")
        print(f"  [SAVED] snapshot -> {snap_path}")

        def upload():
            post_incident_to_api(
                camera_id   = "CAM_01",
                probability = float(avg_probs[1]),
                video_path  = video_path,
                image_path  = snap_path,
            )
            _saving_lock.release()

        threading.Thread(target=upload, daemon=True).start()

    except Exception as e:
        print(f"  [SAVE] Error: {e}")
        _saving_lock.release()

# ── API Config ────────────────────────────────────────────────────────────────
API_BASE     = "https://fydp-2022f-surveillance-system-deployed-production.up.railway.app"
API_USERNAME = "admin@cctv.com"    # ← must be the full email, not just "admin"
API_PASSWORD = "admin1234"
API_TOKEN    = None

def get_token() -> str:
    try:
        response = requests.post(
            f"{API_BASE}/api/auth/login",
            json={
                "email":    API_USERNAME,   # ← changed from "username" to "email"
                "password": API_PASSWORD,
            },
            timeout=5,
        )
        data = response.json()
        if data.get("success"):
            print("  [API] Logged in successfully, token received.")
            return data["token"]
        else:
            print(f"  [API] Login failed: {data.get('error')}")
            return None
    except Exception as e:
        print(f"  [API] Could not reach server for login: {e}")
        return None


def post_incident_to_api(camera_id: str, probability: float,
                          video_path: str, image_path: str) -> None:
    global API_TOKEN
    if not API_TOKEN:
        API_TOKEN = get_token()

    try:
        with open(video_path, "rb") as vf, open(image_path, "rb") as img_f:
            files = {
                "video": (os.path.basename(video_path), vf,  "video/mp4"),   # ← video/mp4
                "image": (os.path.basename(image_path), img_f, "image/jpeg"),
            }
            data = {
                "camera_id":   camera_id,
                "probability": str(round(float(probability), 4)),
            }
            response = requests.post(
                f"{API_BASE}/api/incidents",
                files=files,
                data=data,
                headers={ "Authorization": f"Bearer {API_TOKEN}" },
                timeout=60,
            )

        if response.status_code == 401:
            print("  [API] Token expired, refreshing...")
            API_TOKEN = get_token()
            if API_TOKEN:
                with open(video_path, "rb") as vf, open(image_path, "rb") as img_f:
                    files = {
                        "video": (os.path.basename(video_path), vf,  "video/mp4"),
                        "image": (os.path.basename(image_path), img_f, "image/jpeg"),
                    }
                    response = requests.post(
                        f"{API_BASE}/api/incidents",
                        files=files,
                        data=data,
                        headers={ "Authorization": f"Bearer {API_TOKEN}" },
                        timeout=60,
                    )

        print(f"  [API] Response: {response.status_code} — {response.json()}")

    except Exception as e:
        print(f"  [API] Failed to post incident: {e}")

# ── Model ─────────────────────────────────────────────────────────────────────
def load_model(path: str) -> nn.Module:
    print("Loading model...")
    model = r3d_18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 2)
    model.load_state_dict(torch.load(path, map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    print("Model loaded successfully!\n")
    return model

# ── Preprocessing ─────────────────────────────────────────────────────────────
def preprocess_frame(frame) -> np.ndarray:
    """BGR frame → resized RGB float32 in [0, 1]"""
    resized = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
    rgb     = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
    return (rgb / 255.0).astype(np.float32)

def buffer_to_tensor(frame_buffer: deque) -> torch.Tensor:
    """
    deque of (H, W, 3) float32 arrays →
    tensor [1, 3, T, 112, 112] expected by r3d_18
    """
    frames = np.array(frame_buffer, dtype=np.float32)   # [T, H, W, 3]
    tensor = torch.from_numpy(frames).permute(3, 0, 1, 2)  # [3, T, H, W]
    return tensor.unsqueeze(0).to(DEVICE)               # [1, 3, T, H, W]

# ── Motion detection ──────────────────────────────────────────────────────────
def compute_motion(frame_buffer: deque) -> float:
    frames = np.array(frame_buffer, dtype=np.float32)
    return float(np.mean(np.abs(frames[1:] - frames[:-1])))

# ── Inference ─────────────────────────────────────────────────────────────────
def run_inference(model: nn.Module,
                  tensor: torch.Tensor) -> np.ndarray:
    """Returns raw softmax probabilities as numpy array [nonv, v]."""
    with torch.no_grad():
        outputs = model(tensor)
        probs   = torch.softmax(outputs, dim=1)[0].cpu().numpy()
    return probs

# ── Decision logic ────────────────────────────────────────────────────────────
def classify(motion: float,
             avg_probs: np.ndarray) -> tuple[str, tuple, bool]:
    """
    Mirrors the hybrid logic from your original code.
    Returns (label_text, bgr_color, is_violence)
    """
    nonv_conf = avg_probs[0]
    v_conf    = avg_probs[1]

    if motion > HIGH_MOTION and v_conf > VIOLENCE_THRESHOLD:
        return f"Violence ({v_conf:.2f})", (0, 0, 255), True
    elif motion > HIGH_MOTION:
        return f"High Activity ({nonv_conf:.2f})", (0, 165, 255), False
    else:
        return f"NonViolence ({nonv_conf:.2f})", (0, 255, 0), False

# ── Alert state ────────────────────────────────────────────────────────────────
class AlertState:
    def __init__(self, required_streak: int, cooldown: float):
        self.required_streak = required_streak
        self.cooldown        = cooldown
        self._streak         = 0
        self._last_alert_ts  = 0.0

    def update(self, is_violence: bool) -> bool:
        now = time.monotonic()
        if not is_violence:
            self._streak = 0
            return False
        if now - self._last_alert_ts < self.cooldown:
            self._streak = 0
            return False
        self._streak += 1
        if self._streak >= self.required_streak:
            self._streak        = 0
            self._last_alert_ts = now
            return True
        return False

    @property
    def in_cooldown(self) -> bool:
        return (time.monotonic() - self._last_alert_ts) < self.cooldown

    @property
    def cooldown_remaining(self) -> float:
        return max(0.0, self.cooldown - (time.monotonic() - self._last_alert_ts))

# ── FPS estimator ─────────────────────────────────────────────────────────────
class FPSEstimator:
    def __init__(self, warmup_frames: int = 30):
        self._warmup = warmup_frames
        self._count  = 0
        self._start  = None
        self.fps     = 25.0

    def tick(self) -> None:
        if self._count == 0:
            self._start = time.monotonic()
        self._count += 1
        if self._count == self._warmup:
            elapsed  = time.monotonic() - self._start
            self.fps = self._warmup / elapsed if elapsed > 0 else 25.0
            print(f"[FPS] Measured: {self.fps:.1f}")

# ── Incident saving ───────────────────────────────────────────────────────────
def save_incident(rolling_buffer: deque,
                  fps: float,
                  frame_size: tuple[int, int],
                  avg_probs ) -> None:
    timestamp  = datetime.now().strftime("%Y%m%d_%H%M%S")
    video_path = os.path.join(INCIDENTS_DIR, f"incident_{timestamp}.avi")
    snap_path  = os.path.join(INCIDENTS_DIR, f"snapshot_{timestamp}.jpg")

    fourcc = cv2.VideoWriter_fourcc(*"XVID")
    writer = cv2.VideoWriter(video_path, fourcc, fps, frame_size)
    frames = [f for f, _ in rolling_buffer]
    for f in frames:
        writer.write(f)
    writer.release()

    if frames:
        snapshot = frames[-1].copy()
        ts_text  = datetime.now().strftime("%Y-%m-%d  %H:%M:%S")
        cv2.putText(snapshot, f"VIOLENCE DETECTED  |  {ts_text}",
                    (10, snapshot.shape[0] - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 255), 1, cv2.LINE_AA)
        cv2.imwrite(snap_path, snapshot)

    print(f"  [SAVED] clip     -> {video_path}")
    print(f"  [SAVED] snapshot -> {snap_path}")
    
    # ── ADD THIS at the very end ──────────────────────────────
    post_incident_to_api(
        camera_id   = "CAM_01",        # change if you have multiple cameras
        probability = float(avg_probs[1]),   # ← float() here too    # violence probability from inference
        video_path  = video_path,
        image_path  = snap_path,
    )

# ── Overlay ───────────────────────────────────────────────────────────────────
def draw_overlay(frame, label_text: str, color: tuple,
                 motion: float, alert_active: bool,
                 state: AlertState) -> None:
    # Main prediction label
    cv2.putText(frame, label_text, (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 3, cv2.LINE_AA)

    # Motion level
    cv2.putText(frame, f"Motion: {motion:.4f}", (20, 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 2, cv2.LINE_AA)

    # Alert banner + red border
    if alert_active:
        cv2.rectangle(frame, (0, 0), (frame.shape[1], frame.shape[0]),
                      (0, 0, 255), 6)
        cv2.putText(frame, "VIOLENCE DETECTED | Saving incident...",
                    (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.9,
                    (0, 0, 255), 2, cv2.LINE_AA)

    # Cooldown indicator
    if state.in_cooldown and not alert_active:
        cv2.putText(frame, f"Cooldown: {state.cooldown_remaining:.1f}s",
                    (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.75,
                    (0, 165, 255), 2, cv2.LINE_AA)

# ── Main ──────────────────────────────────────────────────────────────────────
def main() -> None:
    global API_TOKEN

    model         = load_model(MODEL_PATH)
    API_TOKEN = get_token()          # ← add this line

    alert_state   = AlertState(required_streak=CONSECUTIVE_CLIPS,
                               cooldown=COOLDOWN_SECS)
    fps_estimator = FPSEstimator()

    frame_buffer  = deque(maxlen=NUM_FRAMES)   # preprocessed float32 frames
    pred_buffer   = deque(maxlen=SMOOTH_WINDOW) # smoothing window
    rolling_buffer = deque()                    # raw BGR frames for saving

    # Windows DirectShow fix (matches your original)
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        print("Camera not opened")
        return

    frame_w    = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_h    = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    frame_size = (frame_w, frame_h)

    print(f"Device      : {DEVICE}")
    print(f"Resolution  : {frame_w}x{frame_h}")
    print(f"Model input : r3d_18  |  {NUM_FRAMES} frames @ {IMG_SIZE}x{IMG_SIZE}")
    print(f"Incidents   : ./{INCIDENTS_DIR}/")
    print("CCTV Started | Press Q to quit\n")

    label_text   = "Loading..."
    color        = (0, 255, 255)
    motion       = 0.0
    alert_active = False

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break

        fps_estimator.tick()
        alert_active = False

        # ── Rolling buffer (raw BGR for saving) ───────────────────────────
        rolling_capacity = int(fps_estimator.fps * ROLLING_SECS)
        rolling_buffer.append((frame.copy(), time.monotonic()))
        while len(rolling_buffer) > rolling_capacity:
            rolling_buffer.popleft()

        # ── Inference buffer (preprocessed float32) ───────────────────────
        frame_buffer.append(preprocess_frame(frame))

        if len(frame_buffer) == NUM_FRAMES:
            motion = compute_motion(frame_buffer)

            if motion < MOTION_THRESHOLD:
                label_text = "No Activity"
                color      = (0, 255, 255)
                pred_buffer.clear()             # reset smoothing on idle

            else:
                tensor = buffer_to_tensor(frame_buffer)
                probs  = run_inference(model, tensor)
                pred_buffer.append(probs)

                avg_probs  = np.mean(pred_buffer, axis=0)
                label_text, color, is_violence = classify(motion, avg_probs)
                alert_active = alert_state.update(is_violence)

                if alert_active:
                    print(f"\n[ALERT] {datetime.now().strftime('%H:%M:%S')}  "
                          f"Violence confirmed | "
                          f"v_conf={avg_probs[1]:.2f}  motion={motion:.4f}")
                    save_incident(rolling_buffer, fps_estimator.fps, frame_size, avg_probs)
                else:
                    cd = (f"  | cooldown {alert_state.cooldown_remaining:.1f}s"
                          if alert_state.in_cooldown else "")
                    print(f"{label_text}  motion={motion:.4f}{cd}")

        draw_overlay(frame, label_text, color, motion, alert_active, alert_state)
        cv2.imshow("Smart CCTV Violence Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()