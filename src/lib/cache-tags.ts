export const cacheTags = {
  userProfile: (userId: string) => `user:${userId}:profile`,
  userMemories: (userId: string) => `user:${userId}:memories`,
  userDiary: (userId: string) => `user:${userId}:diary`,
  userVault: (userId: string) => `vault:${userId}`,
  userDrafts: (userId: string) => `user:${userId}:drafts`,
  homeFeed: (userId: string) => `home-feed:${userId}`,
  memory: (memoryId: string) => `memory:${memoryId}`,
  memoryEngagement: (memoryId: string) => `memory:${memoryId}:engagement`,
};
