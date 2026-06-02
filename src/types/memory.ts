export type FeedMemoryMedia = {
  id: string;
  url: string;
  mimeType: string;
  mediaKind: "image" | "video" | "audio" | "document";
};

export type FeedMemory = {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  moods: string[];
  privacy: "private" | "followers" | "inner_circle" | "public" | "vault";
  locationName: string | null;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
  media: FeedMemoryMedia[];
  engagement: {
    likeCount: number;
    reflectionCount: number;
    viewerHasLiked: boolean;
    canEngage: boolean;
  };
};
