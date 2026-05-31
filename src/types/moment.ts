export type ActiveMomentMedia = {
  id: string;
  url: string;
  mimeType: string | null;
  mediaKind: "image" | "video";
};

export type ActiveMoment = {
  id: string;
  ownerId: string;
  caption: string | null;
  mood: string | null;
  visibility: "public" | "followers" | "inner_circle" | "private";
  expiresAt: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl: string | null;
  };
  media: ActiveMomentMedia[];
};