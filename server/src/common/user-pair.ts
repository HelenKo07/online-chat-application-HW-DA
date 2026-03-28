export function normalizeUserPair(userIdA: string, userIdB: string) {
  return userIdA < userIdB
    ? { lowUserId: userIdA, highUserId: userIdB }
    : { lowUserId: userIdB, highUserId: userIdA };
}
