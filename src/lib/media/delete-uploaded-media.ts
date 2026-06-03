export async function deleteUploadedMedia(assetIds: string | string[]) {
  const ids = (Array.isArray(assetIds) ? assetIds : [assetIds])
    .map((assetId) => assetId.trim())
    .filter(Boolean);

  if (ids.length === 0) return;

  await fetch("/api/media/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assetIds: ids,
    }),
  });
}
