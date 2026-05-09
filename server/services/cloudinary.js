// const cloudinary = require("cloudinary").v2;
// const path       = require("path");
// const fs         = require("fs");

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key:    process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// async function uploadToCloudinary(localPath, folder, resourceType = "auto") {
//   try {
//     console.log(`  [Cloudinary] Uploading ${resourceType}: ${path.basename(localPath)}`);

//     const uploadOptions = {
//       folder:        `cctv_incidents/${folder}`,
//       resource_type: resourceType,
//       type:          "upload",
//     };

//     // ── Extra options for video ────────────────────────────────────────────
//     if (resourceType === "video") {
//       uploadOptions.eager                  = [{ streaming_profile: "auto", format: "m3u8" }];
//       uploadOptions.eager_async            = false;
//       uploadOptions.flags                  = "attachment:false";
//     }

//     const result = await cloudinary.uploader.upload(localPath, uploadOptions);

//     console.log(`  [Cloudinary] ${resourceType} uploaded: ${result.secure_url}`);
//     return result.secure_url;

//   } catch (err) {
//     console.error(`  [Cloudinary] Upload failed (${resourceType}):`, err.message);
//     console.error(`  [Cloudinary] Full error:`, err.http_code, err.error);
//     return null;
//   }
// }

// module.exports = { uploadToCloudinary };

const cloudinary = require("cloudinary").v2;
const path = require("path");
const fs = require("fs");

// ─────────────────────────────────────────────
// Cloudinary Config
// ─────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─────────────────────────────────────────────
// Helper: Detect resource type
// ─────────────────────────────────────────────
function getResourceType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const videoExt = [".mp4", ".avi", ".mov", ".mkv", ".webm"];
  const imageExt = [".jpg", ".jpeg", ".png", ".webp"];

  if (videoExt.includes(ext)) return "video";
  if (imageExt.includes(ext)) return "image";

  return "auto"; // fallback (rare)
}

// ─────────────────────────────────────────────
// Upload Function
// ─────────────────────────────────────────────
async function uploadToCloudinary(localPath, folder) {
  const resourceType = getResourceType(localPath);

  try {
    console.log(
      `[Cloudinary] Uploading ${resourceType}: ${path.basename(localPath)}`
    );

    const uploadOptions = {
      folder: `cctv_incidents/${folder}`,
      resource_type: resourceType,
    };

    const result = await cloudinary.uploader.upload(
      localPath,
      uploadOptions
    );

    console.log(
      `[Cloudinary] ${resourceType} uploaded: ${result.secure_url}`
    );

    // Optional: delete local file after upload
    try {
      fs.unlinkSync(localPath);
    } catch (e) {
      console.warn("[Cloudinary] Failed to delete local file:", e.message);
    }

    return result.secure_url;
  } catch (err) {
    console.error(`[Cloudinary] Upload failed (${resourceType})`);
    console.error("Message:", err.message);
    console.error("HTTP Code:", err.http_code);
    console.error("Full Error:", JSON.stringify(err, null, 2));

    return null;
  }
}

module.exports = { uploadToCloudinary };