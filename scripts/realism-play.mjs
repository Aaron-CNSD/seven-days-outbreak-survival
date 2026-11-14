import assert from 'node:assert/strict';

export default async function (play) {
  const read = 'pulse.game';
  await play.screenshot('ak47-profile');
  await play.page.getByRole('button', { name: '进入训练场' }).click();
  await play.waitFor(s => s.phase === 'playing', { read });
  await play.mouse.click([.5, .5]);
  await play.waitFor(s => s.active, { read });
  await play.page.mouse.down();
  await play.waitFor(s => s.shots > 0, { read });
  await play.page.mouse.up();
  await play.screenshot('range-first-person');
  if (!(await play.state(read)).active) {
    await play.advance(1.1, { read });
    await play.page.bringToFront();
    await play.mouse.click([.5, .5]);
    await play.waitFor(s => s.active, { read });
  }
  await play.keyboard.press('KeyR');
  await play.waitFor(s => s.reloading, { read });
  await play.advance(.98, { read });
  await play.screenshot('ak47-reload');
  if (!(await play.state(read)).active) {
    await play.advance(1.1, { read });
    await play.page.bringToFront();
    await play.mouse.click([.5, .5]);
    await play.waitFor(s => s.active, { read });
  }
  await play.advance(2.5, { read });
  assert.equal((await play.state(read)).ammo, 30);
  await play.keyboard.press('KeyF');
  await play.waitFor(s => s.inspecting, { read });
  await play.advance(.6, { read });
  await play.screenshot('ak47-inspection');
  await play.reload();
  assert.equal((await play.state(read)).selected, 0);
  return { rendered: true, fired: true, inspection: true };
}
