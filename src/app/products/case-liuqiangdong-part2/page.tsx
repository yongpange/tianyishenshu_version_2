import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '命稿案例—刘强东（续） - 天乙神算官网',
  description: '天乙神算命稿案例分析续篇，刘强东八字命理详解，包含婚恋情缘、身体健康主题深度分析。',
  keywords: '天乙神算, 命稿案例, 刘强东, 八字命理, 婚恋情缘, 身体健康',
}

export default function CaseLiuQiangDongPart2Page() {
  return (
    <div className="min-h-screen bg-white">
      {/* 主要内容 */}
      <main className="min-h-screen bg-white">
        {/* 命稿案例内容 */}
        <article className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* 标题 */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-8 text-center tracking-widest">
                命稿案例—刘强东（续）
              </h1>
            </header>

            {/* 正文内容 */}
            <div className="prose prose-xl max-w-none text-gray-700 leading-relaxed space-y-8">

              {/* 婚恋情缘主题 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">婚恋情缘主题</h2>
                
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">一、情感模式</h3>
                  <p className="mb-4">
                    你的情感世界如同燃烧的火焰，既有温暖热烈的光芒，也暗藏灼人的温度。丙火日主的特质赋予你强烈的自我意识和行动力，在感情中常常表现出主动掌控的倾向。原局中双甲木生丙火，如同两棵大树不断为火堆添柴，使得你的情感需求始终处于旺盛状态——渴望被认可、追求理想化的伴侣形象，同时内心深处又需要情感上的绝对主导权。
                  </p>
                  <p className="mb-4">
                    婚姻宫坐戌土，这个位置如同你精心打造的情感堡垒，既要求稳定务实的生活根基，又暗藏对情感掌控的执着。戌土作为火库，收纳了日时两柱的午火能量，这使得你在亲密关系中容易表现出"外热内冷"的特质：表面上热情洋溢，实则对伴侣有着严苛的衡量标准。这种矛盾在寅午戌三合火局的催化下更为明显，容易在感情稳定后产生倦怠感，转而将精力投向事业或其他领域。
                  </p>

                  <p className="mb-4">
                    情感驱动力的核心在于对成就感的转化。原局中木火通明的气势，使得你会不自觉地将事业成功的模式复制到感情领域。早年丁卯大运（1991-2001）的卯戌相合，暗示着你会被聪明能干、能助益事业的女性吸引，这种择偶标准实质是事业野心的情感投射。当感情与事业产生冲突时（如2003癸未年辰戌丑未四库冲动的流年），会毫不犹豫选择后者，这种决断力成就了事业，却也给亲密关系埋下隐患。
                  </p>

                  <p className="mb-4">
                    核心矛盾体现在能量循环的失衡。旺盛的木火之气需要土金来疏导，但原局中唯一的戌土被三合火局同化，辛金正财深藏时支午火之中难以显现。这种结构导致情感表达容易陷入极端：要么全情投入燃烧自己，要么理性克制保持距离。2015乙未年出现的婚姻契机，本质上是未土刑开戌库释放藏金，暂时平衡了能量场，但长期来看仍需注意情感温度的调节。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">二、婚恋情缘</h3>
                  
                  <h4 className="text-lg font-medium text-black mb-2">早年情缘（1981-2001）</h4>
                  <p className="mb-4">
                    丙寅、丁卯大运期间，木火相生的能量场催发早慧的情感认知。1992壬申年，申金冲动寅木，引动年柱驿马，暗示着离开家乡求学或创业时遇到的初恋。这段感情带着强烈的理想主义色彩，但丁火劫财透出的大运，注定会遭遇现实冲击。1998戊寅年，寅木伏吟加剧木火之势，情感关系中出现第三方竞争压力，此时事业刚起步的你会选择主动割舍。
                  </p>
                  
                  <h4 className="text-lg font-medium text-black mb-2">首段婚姻期（2003-2010）</h4>
                  <p className="mb-4">
                    转入戊辰大运（2001-2011），辰戌相冲激活婚姻宫。2003癸未年，未土刑动戌库，实际应验了与事业伙伴的情感纠葛。这段关系承载着你对"革命伴侣"的完美想象，辰土食神制杀的结构也符合共同创业的命理特征。但2005乙酉年，酉金穿破戌土，财务压力与理念分歧并发；2007丁亥年，亥水官星与寅木相合，事业版图扩张带来的聚少离多，最终在2010庚寅年（岁运寅卯辰三会）彻底结束合作关系。
                  </p>
                  
                  <h4 className="text-lg font-medium text-black mb-2">情感空窗期（2011-2014）</h4>
                  <p className="mb-4">
                    己巳大运初期，巳火禄神暗合申金（原局潜在财星）。2011辛卯年，辛金正财透出却被丙火争合，暗示着会有知名企业寻求合作，但情感上反而进入冷静期。这段时间的戌土婚姻宫被巳火加持，形成火土焦躁的气场，容易陷入对过往情感的反复审视，直至2013癸巳年，双巳火刑动寅木，才真正完成情感断舍离。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">当前婚姻期（2015至今）</h4>
                  <p className="mb-4">
                    2015乙未年，乙木印星坐未土财库，形成官印相生的贵气组合。未土刑开戌库，引动时支午火中暗藏的辛金正财，应验与年轻伴侣的结合。这段关系在己巳大运（2011-2021）中属于能量互补的配置：巳火禄神生扶戌土，未土财库平衡原局燥气。但需注意2017丁酉年（酉戌相害）、2020庚子年（子午相冲）出现的信任危机，本质上都是金水能量冲击原局火土结构的必然反应。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">未来情感走势（2021-2041）</h4>
                  <p className="mb-4">
                    进入辛未、壬申大运，金水能量逐渐增强。2025乙巳年，巳火穿动申金，要注意事业扩张对家庭生活的挤压；2028戊申年，申金冲克寅木根基，需预防因财产分配引发的感情波动；2031辛亥年，亥水官星合入寅木，子女教育问题可能成为情感焦点。这些考验实则是命局需要的金水调候，处理得当反而能增进情感默契。2035乙卯年，卯戌相合化解原局燥气，届时情感关系将进入真正的平稳期。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">三、配偶特质及助力分析</h3>
                  <p className="mb-4">
                    你的八字中，日柱为丙戌，婚姻宫（日支）为戌土，代表配偶的基本特质及双方关系。原局中戌土为火库，藏有丁火、戊土、辛金。其中辛金为财星（妻星），但戌土被月令寅木和时支午火半合火局，形成强大的火势，戌土中的辛金被火克制，这暗示配偶在关系中需要承受一定压力，但同时具备化解矛盾的能力。
                  </p>
                  
                  <h4 className="text-lg font-medium text-black mb-2">1. 配偶性格与能力</h4>
                  <p className="mb-4">
                    辛金藏于戌土，被火压制，象征配偶性格坚韧、低调务实，能在复杂环境中保持冷静。辛金为珠宝金，代表配偶气质优雅、思维细腻，善于处理细节问题。戌土为印库，说明配偶重视家庭，具有较高的学识或文化底蕴，可能在教育、文化领域有所建树。
                  </p>
                  
                  <h4 className="text-lg font-medium text-black mb-2">2. 配偶对事业的助力</h4>
                  <p className="mb-4">
                    戌土作为婚姻宫，被火局强化，代表配偶能通过资源整合为刘强东的事业提供支持。戌土中的辛金虽被克制，但辛金与丙火（日主）暗合，形成"财合身"的格局，说明配偶能直接助力财富积累。此外，午火（时支）为禄神，与戌土半合，体现配偶在关键时刻能调动人脉与资源，帮助化解危机。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">3. 婚姻关系的核心矛盾</h4>
                  <p className="mb-4">
                    原局火势旺盛，戌土被火"烤"，婚姻宫处于高温状态，象征关系易因外界压力或事业冲突产生摩擦。火旺则金弱，刘强东的强势性格可能让配偶感到被压制，需注意沟通方式。此外，月柱丙寅为比肩，与日柱丙戌形成"火势叠加"，暗示早年感情中可能存在竞争或外界干扰，需警惕因过度专注事业而忽视家庭。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">4. 配偶选择与相处建议</h4>
                  <p className="mb-4">
                    <strong>选择偏好：</strong>命局中辛金为用，配偶需具备"刚柔并济"的特质，既能包容火性急躁，又能以智慧化解矛盾。
                  </p>
                  <p className="mb-4">
                    <strong>相处法则：</strong>避免将工作压力带入家庭，需给予配偶更多情感认可；戌土为印库，可通过共同学习或文化项目增进默契。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">四、总结与建议</h3>

                  <h4 className="text-lg font-medium text-black mb-2">1. 婚姻关系总结</h4>
                  <p className="mb-4">你的婚姻宫能量强大，配偶能力出众且助力显著，但火土过旺的格局也带来隐忧：</p>
                  <p className="mb-4">
                    <strong>优势：</strong>配偶是事业发展的关键助力，尤其在资源整合与危机处理上作用突出。
                  </p>
                  <p className="mb-4">
                    <strong>挑战：</strong>关系易受外界压力影响，需避免因性格强势或工作繁忙导致情感疏离。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">2. 未来十年注意事项</h4>
                  <p className="mb-4">当前大运为辛未（2021-2031年），辛金透出为财星，未土与婚姻宫戌土相刑，此阶段需特别注意：</p>

                  <p className="mb-4">
                    <strong>2025年乙巳年：</strong>巳火加强原局火势，可能因决策分歧引发矛盾，需多倾听配偶意见。
                  </p>

                  <p className="mb-4">
                    <strong>2027年丁未年：</strong>未戌刑加剧，谨防外界舆论或家庭琐事导致关系紧张，可通过共同旅行或合作项目缓解压力。
                  </p>

                  <p className="mb-4">
                    <strong>2030年庚戌年：</strong>庚金透出，戌土伏吟婚姻宫，需警惕情感波动，但若能共同应对挑战，反而能加深信任。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">3. 长期建议</h4>
                  <p className="mb-4">
                    <strong>平衡事业与家庭：</strong>火旺之人易"燃烧自己"，需定期回归家庭，通过亲子互动或家庭仪式感增强凝聚力。
                  </p>

                  <p className="mb-4">
                    <strong>借助配偶智慧：</strong>戌土为印库，配偶在战略规划上有独到见解，重大决策前可充分沟通，发挥其"智库"作用。
                  </p>

                  <p className="mb-4">
                    <strong>化解冲突之道：</strong>遇到矛盾时，可借助"金生水"的思维（金为财星，水为官星），以务实态度解决问题，避免情绪化对抗。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">4. 未来展望</h4>
                  <p className="mb-4">
                    2031年后进入壬申大运，壬水为七杀，申金为财星根气，此阶段婚姻关系将趋向稳定。壬水调和原局火势，矛盾减少，配偶的助力将更多体现在战略层面。若能持续重视情感经营，晚年婚姻将呈现"火炼真金，历久弥坚"的态势。
                  </p>
                </div>
              </section>

              {/* 身体健康主题 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">身体健康主题</h2>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">一、核心健康信号</h3>
                  <p className="mb-4">
                    你的八字结构显示火元素占主导地位，这直接影响身体健康的基础信号。八字中，火能量过旺，缺乏水和金元素的平衡，容易导致体内能量失衡，引发潜在健康风险。具体来看：
                  </p>

                  <p className="mb-4">
                    <strong>火势过旺的信号：</strong>你的八字中，火元素占据核心位置（如月柱和日柱均为火相关），火代表心血管、血液循环和神经系统。过强的火能量可能使你天生体质偏热，容易出现心慌、烦躁或睡眠障碍等问题。早年生活（如1981-1991年丙寅大运期间），少年时期的火旺可能表现为易出汗、精力旺盛但易疲劳或皮肤敏感。进入中年后（如2011-2021年己巳大运），火势持续，可能加重心脏或血压负担。
                  </p>

                  <p className="mb-4">
                    <strong>木元素助火的影响：</strong>八字中木元素（如年柱甲寅）生火，进一步加剧火势。这对应肝胆系统功能，易引发肝火旺问题，表现为情绪波动大、消化功能不稳定或眼睛干涩。在2001-2011年戊辰大运期间，土元素介入但被火消耗，可能出现过劳或免疫力下降的迹象。
                  </p>

                  <p className="mb-4">
                    <strong>缺水和金元素的隐患：</strong>水和金元素在八字中几乎缺失，水主肾泌尿系统，金主肺和呼吸系统。这种缺失可能使你体质偏燥，易有口干、炎症倾向或呼吸道敏感。结合大运，2021-2031年辛未大运中，辛金透出但被火克，在2025年乙巳年（火旺流年），需警惕肺部不适或季节性过敏。
                  </p>

                  <p className="mb-4">
                    整体来看，你的健康信号提示需重点关注心血管、肝胆和免疫系统，尤其在火旺年份（如2025年）易有急性问题。建议结合中医和西医视角预防。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">二、中医视角：调养之道</h3>
                  <p className="mb-4">从中医角度看，你的火旺体质需以"滋阴降火"为核心，平衡阴阳能量。具体调养分三方面：</p>

                  <p className="mb-4">
                    <strong>日常饮食调整：</strong>火旺易耗阴液，宜多吃滋阴清火的食物。推荐绿叶蔬菜（如菠菜、芹菜）、凉性水果（如梨、西瓜）和滋补汤品（如银耳莲子汤），以补充水分、润燥。避免辛辣、烧烤或油腻食物，以防加重肝火。例如，在火旺年份如2025年乙巳年，可增加绿豆汤摄入，帮助排毒降温。同时，晨起喝温柠檬水，调和肝胆功能。
                  </p>

                  <p className="mb-4">
                    <strong>生活作息管理：</strong>火主心，易因情绪起伏引发失眠或心悸。建议建立规律作息，保证7-8小时睡眠，避免熬夜（尤其在23:00-1:00肝胆修复时段）。午后小憩20分钟，能缓解疲劳。情绪上，多练习深呼吸或太极，疏导肝火。结合大运，如2011-2021年己巳大运期间，火土相生，压力大时可通过泡脚（加菊花或薄荷）舒筋活络。
                  </p>

                  <p className="mb-4">
                    <strong>中医养生技巧：</strong>针对肾水不足（因缺水元素），可穴位按摩如涌泉穴（脚心）和太冲穴（脚背），每日5分钟，增强肾气。季节性调养：春夏火旺季（如4-8月），用菊花茶或枸杞泡水；秋冬干燥时，用蜂蜜水润肺。长期坚持，能改善体质偏热问题，预防炎症。
                  </p>

                  <p className="mb-4">总之，中医调养需贯穿生活细节，重在"慢养"而非急治。</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">三、西医视角：预防重点</h3>
                  <p className="mb-4">西医角度分析，你的火旺体质易对应代谢和炎症性疾病风险。预防措施需针对高发问题：</p>

                  <p className="mb-4">
                    <strong>心血管系统防护：</strong>火旺预示血压和心脏负荷易波动。建议每年做一次全面体检，包括血压监测、心电图和血脂检查（总胆固醇和低密度脂蛋白）。40岁后（如2021-2031年辛未大运期间），可每半年复查，结合2025年乙巳年（火旺流年），注意避免高温环境或剧烈运动，以防突发心悸。饮食上，控制盐分摄入（每日＜6g），多吃鱼油或坚果，补充Omega-3脂肪酸，保护血管弹性。
                  </p>

                  <p className="mb-4">
                    <strong>炎症和免疫风险防控：</strong>缺水和金元素易引发慢性炎症，如呼吸道感染或皮肤过敏。日常增强免疫力：接种流感疫苗（尤其秋季），勤洗手、戴口罩减少暴露。在火旺年份如2025年，避免花粉密集区，使用空气净化器。饮食补充维生素C（柑橘类水果）和锌（贝类），促进抗体生成。如出现反复炎症（如咽炎），及时就医排查过敏原。
                  </p>

                  <p className="mb-4">
                    <strong>代谢疾病预防：</strong>木火旺可能影响肝胆代谢，增加脂肪肝或糖尿病风险。管理体重（BMI保持18.5-24），每周150分钟中等运动（如快走或游泳）。50岁后（2031-2041年壬申大运），定期查血糖和肝功能。避免烟酒，减少红肉摄入，选择全谷物膳食。
                  </p>

                  <p className="mb-4">通过这些预防措施，能有效降低健康风险。核心是定期筛查和生活干预相结合。</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">四、情志影响与修心之法</h3>
                  <p className="mb-4">
                    你的八字中木火能量极强（年柱甲寅、月柱丙寅、时柱甲午），这会让你的情绪像夏天的烈日一样热烈而直接。木对应肝胆，火对应心脏，这种组合容易带来三种影响：
                  </p>

                  <p className="mb-4">
                    <strong>急躁与冲动：</strong>火旺会让你做事雷厉风行，但遇到阻碍时易怒发冲冠，可能引发头痛、失眠或血压波动。
                  </p>

                  <p className="mb-4">
                    <strong>过度消耗感：</strong>木火相生如同不断添柴的火焰，虽然精力旺盛，却容易过度消耗身心，导致疲惫感突然袭来。
                  </p>

                  <p className="mb-4">
                    <strong>情感波动：</strong>时柱午火藏丁火（劫财），潜意识里容易与他人较劲，长期积累可能引发心悸或胸闷。
                  </p>

                  <p className="mb-4">修心养性的核心是"水火平衡"：</p>

                  <p className="mb-4">
                    <strong>以水制火：</strong>每天晨起喝一杯温水（可加少许盐），傍晚静坐10分钟观想溪流画面，让身体记住"清凉感"。
                  </p>

                  <p className="mb-4">
                    <strong>借土疏导：</strong>木火太旺需土来疏导，可定期进行陶艺、园艺等接地气的活动，戌土（日支）代表你的承受力，种些多肉植物能唤醒这份能量。
                  </p>

                  <p className="mb-4">
                    <strong>情绪急救法：</strong>当怒火上涌时，立即用拇指按压无名指根部（手掌肝胆反射区），同时缓慢呼气七次——这是利用金（肺）来制约过旺的木火。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">五、未来30年健康重点</h3>
                  <p className="mb-4">未来三个大运阶段需差异化养护：</p>

                  <h4 className="text-lg font-medium text-black mb-2">己巳大运（约2024-2034年）：</h4>
                  <p className="mb-4">
                    <strong>健康焦点：</strong>巳火加剧命局火势，要像保护精密仪器般养护心血管。
                  </p>
                  <p className="mb-4">
                    <strong>饮食关键：</strong>早餐多吃白色食物（山药粥、杏仁露），晚餐补充黑色食材（紫菜汤、黑木耳）。避免午时（11-13点）吃辛辣。
                  </p>
                  <p className="mb-4">
                    <strong>特别提醒：</strong>每年立夏前后做心电检查，随身备着生核桃仁（每日5颗），其中的不饱和脂肪酸是天然的"消防栓"。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">辛未大运（约2034-2044年）：</h4>
                  <p className="mb-4">
                    <strong>健康转折：</strong>未土与命局戌土相刑，消化系统迎来考验。
                  </p>
                  <p className="mb-4">
                    <strong>饮食策略：</strong>采用"三三制"——三餐定时，每餐先吃三口温热的黄色食物（南瓜、小米）再进主食。下午申时（15-17点）喝陈皮蜂蜜水。
                  </p>
                  <p className="mb-4">
                    <strong>重点防护：</strong>此时金气透出（辛金），要特别防护呼吸道，秋冬用雪梨、百合、银耳隔水蒸服。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">壬申大运（约2044年后）：</h4>
                  <p className="mb-4">
                    <strong>身体新课题：</strong>申金冲年柱寅木（寅申冲），需关注筋骨柔韧度。
                  </p>
                  <p className="mb-4">
                    <strong>终身食养：</strong>养成喝墨鱼骨汤的习惯（每周1次），搭配芝麻核桃粉。晨起做"太极云手"式伸展，重点活动肩颈。
                  </p>
                  <p className="mb-4">
                    <strong>智慧调养：</strong>壬水带来深层智慧，此阶段可研习书法或茶道，用慢艺术滋养身心。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">六、意外伤灾与关键年份</h3>
                  <p className="mb-4">你的命局有双寅木（年、月支）配午火，需警惕三类意外：</p>

                  <p className="mb-4">
                    <strong>火性突发风险：</strong>高温、电路相关的伤害（如厨房烫伤、电器短路）。
                  </p>

                  <p className="mb-4">
                    <strong>木性动态伤害：</strong>与交通工具相关的碰撞（尤其摩托车、自行车）。
                  </p>

                  <p className="mb-4">
                    <strong>冲克型旧疾：</strong>寅木主筋骨，戌土主关节，突发性扭伤概率较高。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">2025-2035关键防护年份：</h4>
                  <p className="mb-2">●2025乙巳年：农历四月（巳月）避免野外用火，开车忌急躁超车。</p>
                  <p className="mb-2">●2027丁未年：未戌相刑，慎防厨房滑倒，建议给地面铺防滑垫。</p>
                  <p className="mb-2">●2031辛亥年：亥水合动双寅木，登山远足需备好护膝，避免雨天出行。</p>
                  <p className="mb-4">●2033癸丑年：丑戌相刑，注意冷藏食品卫生，慎防食物中毒引发的急症。</p>

                  <h4 className="text-lg font-medium text-black mb-2">预防之道：</h4>
                  <p className="mb-2">1.每年惊蛰前后做全面体检（特别关注肝胆指标）。</p>
                  <p className="mb-2">2.在卧室西北角放置圆形鱼缸（养6条黑色金鱼），形成"水制火"的稳定气场。</p>
                  <p className="mb-4">3.随身佩戴白玉平安扣（土生金制木），尤其在上述关键年份。</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">七、总结</h3>
                  <p className="mb-4">
                    你的生命能量如盛夏骄阳，拥有强大的创造力和行动力，但需要智慧的"遮阳伞"。未来健康养护的核心在于：当前十年（己巳运）要像保护水晶灯般呵护心血管，通过"白色早餐+黑色晚餐"饮食法平衡火气。
                  </p>

                  <p className="mb-4">
                    六十岁前后（辛未运）要把脾胃当作"黄金仓库"，用温养代替进补。
                  </p>

                  <p className="mb-4">
                    七十岁后（壬申运）则重在维持筋骨柔韧，把养生融入艺术生活。
                  </p>

                  <p className="mb-4">
                    意外防护的重点年份已明确标注，其实只要在相应年份提高10%的警觉性，就能避免90%的风险。真正的健康密码，藏在"知火用火"的智慧里——你炽热的生命力是上天的礼物，学会像熟练的炼金师般调和它，必将收获丰盛而从容的人生四季。
                  </p>
                </div>
              </section>

            </div>

            {/* 返回按钮 */}
            <div className="mt-12 text-center">
              <Link href="/products/case-liuqiangdong">
                <button className="btn-secondary px-8 py-3 mr-4">
                  返回第一部分
                </button>
              </Link>
              <Link href="/products/case-analysis">
                <button className="btn-secondary px-8 py-3">
                  返回案例分析
                </button>
              </Link>
            </div>

          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            {/* 左侧空白区域，用于平衡布局 */}
            <div className="hidden md:block md:w-1/3"></div>
            
            {/* 中间品牌信息 */}
            <div className="text-center md:w-1/3 mb-6 md:mb-0">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <TianIcon width={24} height={24} className="text-black" />
                <span className="text-lg font-bold text-black">天乙神算</span>
              </div>
              <p className="text-gray-600">
                © 2025 天乙神算. 保留所有权利.
              </p>
            </div>
            
            {/* 右侧客服入口 */}
            <div className="text-center md:text-right md:w-1/3">
              <h3 className="text-lg font-semibold mb-4">请联系下方微信客服~</h3>
              <div className="flex justify-center md:justify-end space-x-4">
                <div className="text-center">
                  <img
                    src="/images/wechat-qr-1.jpg"
                    alt="客服微信1"
                    className="w-20 h-20 mx-auto mb-2"
                  />
                  <p className="text-xs text-gray-400">芷暄师妹</p>
                </div>
                <div className="text-center">
                  <img
                    src="/images/wechat-qr-2.jpg"
                    alt="客服微信2"
                    className="w-20 h-20 mx-auto mb-2"
                  />
                  <p className="text-xs text-gray-400">丁火师妹</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
