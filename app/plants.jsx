export const PLANTS = [
  { id: "peach", name: "蜜桃花树", kind: "tree", main: "#ef8e9d", light: "#ffd2d7", leaf: "#89a968" },
  { id: "sakura", name: "樱花树", kind: "tree", main: "#f3a8bd", light: "#ffe0e8", leaf: "#9eb873" },
  { id: "apple", name: "苹果树", kind: "tree", main: "#db5b58", light: "#f6b174", leaf: "#6e9c61" },
  { id: "lemon", name: "柠檬树", kind: "tree", main: "#f2c94c", light: "#fff2a6", leaf: "#76a85e" },
  { id: "lavender_tree", name: "薰衣草树", kind: "tree", main: "#9b80c7", light: "#d9c9f0", leaf: "#6f9f73" },
  { id: "bluebell_tree", name: "蓝铃花树", kind: "tree", main: "#68a5c9", light: "#c9e6f1", leaf: "#679b79" },
  { id: "maple", name: "暖阳枫树", kind: "tree", main: "#dc7652", light: "#f5bf74", leaf: "#b95c48" },
  { id: "willow", name: "月光柳树", kind: "willow", main: "#91b46d", light: "#c8d99b", leaf: "#6e9b61" },
  { id: "pine", name: "云杉", kind: "conifer", main: "#3f8069", light: "#79ae84", leaf: "#276554" },
  { id: "snow_pine", name: "雪松", kind: "conifer", main: "#6f9e8a", light: "#e6f3ed", leaf: "#427566" },
  { id: "sunflower", name: "向日葵", kind: "flower", main: "#f3b633", light: "#ffe989", leaf: "#70a05d" },
  { id: "tulip", name: "草莓郁金香", kind: "flower", main: "#eb6f83", light: "#ffc2c9", leaf: "#77a866" },
  { id: "daisy", name: "奶油雏菊", kind: "flower", main: "#fff8e6", light: "#fffdf8", leaf: "#77a268" },
  { id: "iris", name: "蓝鸢尾", kind: "flower", main: "#777bc2", light: "#b7b9ea", leaf: "#6c9e77" },
  { id: "rose", name: "心愿玫瑰", kind: "flower", main: "#df6177", light: "#f7a6b5", leaf: "#648f61" },
  { id: "hydrangea", name: "云朵绣球", kind: "bush", main: "#8db6dd", light: "#d7e8f7", leaf: "#6d9a6d" },
  { id: "berry_bush", name: "莓果灌木", kind: "bush", main: "#c75b72", light: "#f19aab", leaf: "#5e9366" },
  { id: "mint_bush", name: "薄荷团子", kind: "bush", main: "#70b69b", light: "#b9e0ca", leaf: "#5a987d" },
  { id: "cotton", name: "棉花云", kind: "bush", main: "#f8f3e8", light: "#ffffff", leaf: "#85a977" },
  { id: "succulent", name: "星星多肉", kind: "succulent", main: "#76b9a4", light: "#bce0cd", leaf: "#5d9c8d" },
  { id: "pink_succulent", name: "蜜糖多肉", kind: "succulent", main: "#db8fa5", light: "#f8cbd6", leaf: "#7ca778" },
  { id: "cactus", name: "拥抱仙人掌", kind: "cactus", main: "#66a66e", light: "#9bd08f", leaf: "#438454" },
  { id: "bunny_cactus", name: "兔耳仙人掌", kind: "cactus", main: "#7eae6c", light: "#b7d49d", leaf: "#568b55" },
  { id: "red_mushroom", name: "红帽蘑菇", kind: "mushroom", main: "#dc6158", light: "#fff4dc", leaf: "#789b67" },
  { id: "moon_mushroom", name: "月光蘑菇", kind: "mushroom", main: "#8f82c8", light: "#dfd8f7", leaf: "#71927a" },
  { id: "bamboo", name: "青竹", kind: "bamboo", main: "#6da267", light: "#a9ca84", leaf: "#4d8652" },
  { id: "wisteria", name: "紫藤小亭", kind: "willow", main: "#9b7fc5", light: "#d9c8ef", leaf: "#648e6b" },
  { id: "rainbow", name: "彩虹花", kind: "fantasy", main: "#ef7994", light: "#f5c85f", leaf: "#6ba079" },
  { id: "star_tree", name: "星愿树", kind: "fantasy", main: "#f2c45c", light: "#fff0a6", leaf: "#628f86" },
  { id: "ocean_coral", name: "海风珊瑚", kind: "fantasy", main: "#58afbd", light: "#b8e3e4", leaf: "#6b9d85" },
  { id: "cake_tree", name: "奶油蛋糕树", kind: "fantasy", main: "#ef9eaf", light: "#fff0dd", leaf: "#79a56e" },
  { id: "night_tree", name: "晚安星树", kind: "fantasy", main: "#526aa0", light: "#9db2df", leaf: "#536f76" }
];

const PLANT_ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const plantById = id => PLANTS.find(plant => plant.id === id) || PLANTS[0];

export function PlantArt({ id, stage = 4, className = "", title }) {
  const plant = plantById(id);
  const safeStage = Math.max(0, Math.min(4, Number(stage)));
  const plantIndex = Math.max(0, PLANTS.findIndex(item => item.id === plant.id));
  const scale = [0.3, 0.43, 0.62, 0.82, 1][safeStage];
  const translateY = 98 - 98 * scale;
  const common = { stroke: "#5d684f", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round" };

  if (safeStage === 0) {
    return (
      <svg className={`plant-art ${className}`} viewBox="0 0 100 120" role="img" aria-label={title || `${plant.name}种子`}>
        <ellipse cx="50" cy="108" rx="24" ry="6" fill="#40523c20" />
        <path d="M36 104c8-11 20-11 28 0" fill="#956f50" {...common} />
        <ellipse cx="50" cy="99" rx="8" ry="5" fill={plant.main} transform="rotate(-14 50 99)" />
      </svg>
    );
  }

  if (safeStage >= 2) {
    const sheet = plantIndex < 16 ? "a" : "b";
    const sheetIndex = plantIndex % 16;
    const column = sheetIndex % 4;
    const row = Math.floor(sheetIndex / 4);
    return (
      <span
        className={`plant-art plant-sprite stage-${safeStage} ${className}`}
        role="img"
        aria-label={title || plant.name}
      >
        <span
          className="plant-sprite-image"
          style={{
            "--plant-sheet": `url("${PLANT_ASSET_BASE}/plants/plant-collection-${sheet}-final.png")`,
            "--plant-x": `${column * 100 / 3}%`,
            "--plant-y": `${row * 100 / 3}%`
          }}
        />
      </span>
    );
  }

  return (
    <svg className={`plant-art ${className}`} viewBox="0 0 100 120" role="img" aria-label={title || plant.name}>
      <ellipse cx="50" cy="108" rx={safeStage < 3 ? 20 : 30} ry="6" fill="#40523c22" />
      <g transform={`translate(${50 - 50 * scale} ${translateY}) scale(${scale})`}>
        {safeStage === 1 ? <Sprout plant={plant} common={common} /> : <MaturePlant plant={plant} common={common} />}
      </g>
    </svg>
  );
}

function Sprout({ plant, common }) {
  return (
    <>
      <path d="M50 105C49 88 50 79 50 70" fill="none" stroke={plant.leaf} strokeWidth="5" strokeLinecap="round" />
      <path d="M49 82C37 72 27 76 30 87c8 5 15 2 19-5Z" fill={plant.light} {...common} />
      <path d="M51 76c9-12 20-10 20 1-5 7-13 7-20-1Z" fill={plant.main} {...common} />
    </>
  );
}

function MaturePlant({ plant, common }) {
  const { kind } = plant;
  if (kind === "flower") return <Flower plant={plant} common={common} />;
  if (kind === "bush") return <Bush plant={plant} common={common} />;
  if (kind === "succulent") return <Succulent plant={plant} common={common} />;
  if (kind === "cactus") return <Cactus plant={plant} common={common} />;
  if (kind === "mushroom") return <Mushroom plant={plant} common={common} />;
  if (kind === "bamboo") return <Bamboo plant={plant} common={common} />;
  if (kind === "conifer") return <Conifer plant={plant} common={common} />;
  if (kind === "willow") return <Willow plant={plant} common={common} />;
  if (kind === "fantasy") return <Fantasy plant={plant} common={common} />;
  return <Tree plant={plant} common={common} />;
}

function Tree({ plant, common }) {
  return (
    <>
      <path d="M44 106c4-19 3-35 7-50 5 17 3 34 8 50Z" fill="#96684c" {...common} />
      <path d="M50 76 34 59M52 68l17-15" fill="none" stroke="#805a45" strokeWidth="6" strokeLinecap="round" />
      <circle cx="31" cy="49" r="20" fill={plant.leaf} {...common} />
      <circle cx="54" cy="38" r="25" fill={plant.light} {...common} />
      <circle cx="73" cy="53" r="20" fill={plant.leaf} {...common} />
      <circle cx="51" cy="59" r="22" fill={plant.main} opacity=".94" {...common} />
      {[["36","38"],["58","30"],["68","54"],["48","61"]].map(([x,y], index) => <circle key={index} cx={x} cy={y} r="4.5" fill={index % 2 ? plant.main : plant.light} />)}
    </>
  );
}

function Willow({ plant, common }) {
  return (
    <>
      <path d="M45 106c6-22 5-39 9-60 7 23 3 42 8 60Z" fill="#976a4d" {...common} />
      <circle cx="52" cy="41" r="24" fill={plant.leaf} {...common} />
      {[25,36,48,60,72].map((x, i) => <path key={x} d={`M${x} 38c${i % 2 ? 8 : -6} 20 2 35 ${i % 2 ? 7 : -2} 49`} fill="none" stroke={i % 2 ? plant.main : plant.light} strokeWidth="6" strokeLinecap="round" />)}
      <circle cx="52" cy="35" r="18" fill={plant.light} opacity=".7" />
    </>
  );
}

function Conifer({ plant, common }) {
  return (
    <>
      <path d="M46 105h10l-2-28h-6Z" fill="#8f6549" {...common} />
      <path d="M50 17 25 64h16L20 88h61L61 64h15Z" fill={plant.leaf} {...common} />
      <path d="M50 17 37 63h13L34 86h17Z" fill={plant.light} opacity=".75" />
      <circle cx="37" cy="55" r="3" fill={plant.main} /><circle cx="59" cy="70" r="3" fill={plant.main} />
    </>
  );
}

function Flower({ plant, common }) {
  return (
    <>
      <path d="M50 103V49M49 77c-12-11-22-6-20 5 9 6 16 3 20-5Zm2 11c12-12 23-7 21 4-9 6-17 3-21-4Z" fill={plant.leaf} stroke={plant.leaf} strokeWidth="4" strokeLinecap="round" />
      {[0,72,144,216,288].map(angle => <ellipse key={angle} cx="50" cy="37" rx="10" ry="19" fill={angle % 144 ? plant.main : plant.light} transform={`rotate(${angle} 50 49)`} {...common} />)}
      <circle cx="50" cy="49" r="9" fill="#e9b64d" {...common} />
    </>
  );
}

function Bush({ plant, common }) {
  return (
    <>
      <path d="M33 101 43 72M68 101 59 70" stroke="#7d6548" strokeWidth="5" />
      <circle cx="30" cy="73" r="20" fill={plant.leaf} {...common} />
      <circle cx="49" cy="57" r="24" fill={plant.light} {...common} />
      <circle cx="70" cy="73" r="20" fill={plant.leaf} {...common} />
      <circle cx="49" cy="79" r="23" fill={plant.main} {...common} />
      {[["34","61"],["56","50"],["68","74"],["44","82"],["58","72"]].map(([x,y], i) => <circle key={i} cx={x} cy={y} r="4" fill={i % 2 ? "#fff8ea" : plant.main} />)}
    </>
  );
}

function Succulent({ plant, common }) {
  return (
    <>
      <path d="M30 89h40l-5 18H35Z" fill="#d78e78" {...common} />
      {[0,45,90,135,180,225,270,315].map((angle, index) => <ellipse key={angle} cx="50" cy="68" rx="9" ry="28" fill={index % 2 ? plant.main : plant.light} transform={`rotate(${angle} 50 76)`} {...common} />)}
      <circle cx="50" cy="75" r="10" fill={plant.leaf} />
    </>
  );
}

function Cactus({ plant, common }) {
  return (
    <>
      <path d="M36 91h29l-4 16H40Z" fill="#e7a57e" {...common} />
      <path d="M50 91V33c0-10 16-10 16 0v21c7 0 6-15 6-15 0-8 12-8 12 0v17c0 9-7 15-18 15v20Zm0-19c-12 0-22-7-22-18V43c0-8 12-8 12 0v10c0 6 4 7 10 7Z" fill={plant.main} {...common} />
      <path d="M58 31v55M34 46v14M76 41v12" stroke={plant.light} strokeWidth="2" strokeDasharray="4 5" />
      <circle cx="58" cy="25" r="6" fill="#ef8aa2" />
    </>
  );
}

function Mushroom({ plant, common }) {
  return (
    <>
      <path d="M40 101c6-17 5-27 7-39h15c2 13 1 25 7 39Z" fill="#f2dfbd" {...common} />
      <path d="M18 63c3-25 19-39 37-39s34 14 38 39c-21 8-52 8-75 0Z" fill={plant.main} {...common} />
      {[["34","48","6"],["59","36","7"],["74","53","5"]].map(([x,y,r], i) => <circle key={i} cx={x} cy={y} r={r} fill={plant.light} />)}
      <circle cx="51" cy="79" r="2.2" fill="#6d5c52" /><circle cx="61" cy="79" r="2.2" fill="#6d5c52" />
    </>
  );
}

function Bamboo({ plant, common }) {
  return (
    <>
      {[35,50,65].map((x,i) => <g key={x}><path d={`M${x} 105c${i-1} -25 ${2-i} -53 ${i-1} -82`} fill="none" stroke={i === 1 ? plant.main : plant.light} strokeWidth="8" strokeLinecap="round" /><path d={`M${x-4} 76h9M${x-3} 51h8`} stroke={plant.leaf} strokeWidth="2" /></g>)}
      <path d="M49 51c-18-12-25-4-20 7 10 5 16 1 20-7ZM52 69c17-14 25-5 20 6-10 5-16 1-20-6ZM37 35c-14-12-21-4-17 6 8 5 13 2 17-6Z" fill={plant.leaf} {...common} />
    </>
  );
}

function Fantasy({ plant, common }) {
  return (
    <>
      <path d="M45 105c5-19 2-34 7-48 6 15 4 30 9 48Z" fill="#8c674e" {...common} />
      <path d="M50 22 58 43 80 45 63 59 68 82 50 70 30 82 36 59 19 45 42 43Z" fill={plant.main} {...common} />
      <path d="M50 31 54 46 68 48 57 57 60 70 50 63 39 70 43 57 32 48 46 46Z" fill={plant.light} opacity=".8" />
      <circle cx="25" cy="30" r="3" fill="#f8d77c" /><circle cx="79" cy="28" r="4" fill="#f8d77c" /><circle cx="84" cy="69" r="2.5" fill="#fff4c2" />
    </>
  );
}
