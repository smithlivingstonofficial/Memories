type UploadMediaOptions = {
  file: File;
  purpose: "profile_avatar" | "profile_cover" | "memory" | "moment" | "vault";
  visibility: "private" | "inner_circle" | "public";
};

export async function uploadMedia({
  file,
  purpose,
  visibility,
}: UploadMediaOptions) {
  const presignResponse = await fetch("/api/media/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      purpose,
      visibility,
    }),
  });

  const presignData = await presignResponse.json();

  if (!presignResponse.ok) {
    throw new Error(presignData.message || "Unable to prepare upload.");
  }

  const uploadResponse = await fetch(presignData.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Upload failed.");
  }

  const confirmResponse = await fetch("/api/media/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assetId: presignData.assetId,
    }),
  });

  const confirmData = await confirmResponse.json();

  if (!confirmResponse.ok) {
    throw new Error(confirmData.message || "Unable to confirm upload.");
  }

  return {
    assetId: presignData.assetId as string,
    objectKey: presignData.objectKey as string,
    publicUrl: presignData.publicUrl as string | null,
  };
}