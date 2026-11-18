export const defaultBindings = {
  rack: 'KeyE', reload: 'KeyR', inspect: 'KeyF', medkit: 'KeyV',
  plate: 'KeyB', round: 'KeyT', map: 'KeyM',
};
export type BoundAction = keyof typeof defaultBindings;
export const bindingLabels: Record<BoundAction, string> = {
  rack: '背包', reload: '换弹', inspect: '检视', medkit: '医疗包',
  plate: '护甲板', round: '对抗训练', map: '区域地图',
};
export const actions = Object.keys(defaultBindings) as BoundAction[];
export function allowedKey(code: string) {
  return /^Key[A-Z]$/.test(code) && !['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyC','KeyZ','KeyG','KeyH'].includes(code);
}
export function restoreBindings(value: unknown) {
  const result = {...defaultBindings};
  if (!value || typeof value !== 'object') return result;
  for (const action of actions) {
    const code = (value as Record<string, unknown>)[action];
    if (typeof code !== 'string' || !allowedKey(code)) return {...defaultBindings};
    result[action] = code;
  }
  return new Set(Object.values(result)).size === actions.length ? result : {...defaultBindings};
}
