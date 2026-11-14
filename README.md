# FIELD / 05 — 封闭训练场

使用天工引擎 0.4.19。当前包含五把武器，新增封闭射击训练场，暂无敌人。

- AK-47：30 发弹匣、自动射击。
- AWM：5 发弹匣、单发拉栓间隔、10× 瞄准镜。
- Glock 17：17 发弹匣、半自动点射。
- SCAR-L：沙色卡宾枪，框式红点瞄具，30 发弹匣。
- MP5 A3：双杆伸缩托冲锋枪，30 发弹匣，射速快、后坐轻。

五把武器拥有独立弹药与备用弹药、换弹时长、枪口火光、射击声音及后坐动画。切枪会取消未完成的换弹；空弹匣需要主动换弹。靶场包含 10/20/30/40 米四个靶位，命中显示弹孔、音效和计数，头部单独统计。

PC：进入测试后点击场景锁定鼠标；WASD 移动，Space 跳跃，双击并按住 W 奔跑，左键射击，右键瞄准，R 换弹，1–4 或滚轮切枪，Esc 暂停并释放鼠标，F 检视武器。

手机：左摇杆移动，右侧滑动视角，开火按钮按住射击（AWM/Glock 每次按下单发），瞄准按钮切换瞄准，↻ 换弹，顶部卡片切枪。支持横屏、竖屏。检视按钮可查看枪身侧面和机械细节。

武器采用本地源代码生成的高细节体素模型，通过天工 Pack/Scene/Material 资产管线渲染。出生点在遮棚下，四周 6 米围墙带物理碰撞。靶面保留最近 32 个弹孔，刷新重置。

验证：`pnpm test`、`pnpm typecheck`、`pnpm exec forgeax project play scripts/range-playthrough.mjs --require-ui --json`。

造化平台通过 `assets/runtime/zaohua-platform-init.js` 完成基础 SDK 初始化。尚未发布，未接入多人联机或云存档。

高细节版：AK-47 / AWM / Glock 分别包含 518 / 424 / 511 个几何细节，枪身带像素化材料纹理和刻字。四类 PBR 材质配合逐顶点颜色保持像素变化，模型按身体、弹匣、枪机、双手分组。支持弹匣拆装、枪机／套筒动作和战术手套。


场景表现：带云层的 HDR 日光环境、混凝土水渍与修补、地面接缝与细微色差、排水格栅、砂砾、散落弹壳、逐层沙袋和棚顶结构。环境保持四类 PBR 材质分组；桌面锁定鼠标后武器卡片收紧以减少遮挡。

## 战术装备与对抗训练
携带限制为两把主武器、Glock 手枪和近战刀。出生点后方设有实体装备台，靠近后按 E 更换主武器、1–6 级护甲和原钢／鎏金／冰蓝刀皮。未携带的主武器显示在装备架上。护甲上限为 85/110/135/160/185/210，吸收伤害比例为 39/48/57/66/75/84%，移动系数为 100/96.5/93/89.5/86/82.5%。

PC：1/2 主武器、3 手枪、4 刀；按住 Shift 蹲下；F 手持检视；5 选破片手雷、6 选烟雾弹，右键或长按左键投掷；V 医疗包、B 护甲板；T 开始或重开三敌对抗。手机用屏幕按钮选投掷物，再长按开火投掷，按住蹲下按钮保持蹲姿。开火造成视角后坐，蹲下和瞄准降低后坐。M870 发射八颗散射弹丸，刀的攻击范围为 2.2 米。

医疗包用时 3 秒恢复 65 生命，护甲板用时 2 秒恢复 50 护甲，完成后扣除库存。受伤或切换武器中断使用。手雷两秒引信、范围衰减并可能自伤；烟雾持续十秒并阻断敌人射击判定。敌人仅在按 T 后启动，三名全部击倒后结束。刷新重置本地训练状态。

验证：scripts/tactical-playthrough.mjs（桌面）、scripts/tactical-touch.mjs（模拟触屏）、Tactical 状态单元测试。

### Laptop performance pass (2026-11-05)
- Only the visible held weapon animates; changing slots explicitly hides the previous weapon.
- Rack and knife skin transforms update only when the loadout/skin changes. Idle tactical props no longer republish identical transforms.
- HUD nodes are retained and text is written only when it changes.
- Sun shadows use two 1024px cascades over 48m (previous defaults: three 2048px cascades over 70m). Weapon geometry is unchanged.
- These reduce work; no before/after hardware FPS claim is made without a matched device measurement.

## GitHub 源码发布

将要发布的提交推送到 GitHub 后，为该提交创建并推送一个新的版本标签，例如：

```bash
git tag -a v0.1.1 -m "七天惊变生存 v0.1.1"
git push origin v0.1.1
```

GitHub Actions 会发布同名 Release，并附上该标签对应的完整源码 ZIP。带 `-beta.1` 等后缀的标签会发布为预发行版本。
