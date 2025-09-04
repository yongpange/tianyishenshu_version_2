import Link from 'next/link'
import TianIcon from '@/components/icons/TianIcon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '命稿案例—刘涛（完结篇） - 天乙神算官网',
  description: '天乙神算命稿案例分析完结篇，刘涛八字命理详解，包含婚恋情缘、身体健康主题深度分析。',
  keywords: '天乙神算, 命稿案例, 刘涛, 八字命理, 婚恋情缘, 身体健康',
}

export default function CaseLiuTaoPart3Page() {
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
                命稿案例—刘涛（完结篇）
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
                    你的情感世界如同一条蜿蜒的河流，既有平静的港湾，也有湍急的暗流。日柱乙亥的乙木扎根于亥水正印，滋养出细腻敏感的心性，对情感的需求既渴望稳定，又容易被细节牵动。亥水为夫妻宫，正印为喜用神，暗示你内心期待伴侣具备包容力与智慧，能成为精神上的依靠。然而，月柱己未的偏财与日支亥水相克，早年容易因现实压力（如经济条件、家庭背景）与理想化的情感产生冲突，这种矛盾会促使你在关系中不断权衡付出与回报。庚金正官透于时柱，代表晚年的情感归宿更为清晰，但早年官星被年柱午火食神压制，暗示青年时期容易遇到"看似合适却难以深入"的缘分。你的情感驱动往往源于对安全感的追寻，但月令未土中的比肩（乙木藏干）又带来潜在的竞争意识，可能在感情中表现出"既依赖又独立"的矛盾特质。例如，你会被成熟稳重的人吸引，却又担心对方过于强势而失去自我空间。
                  </p>
                  <p className="mb-4">
                    核心矛盾在于"理想与现实的双重标准"。亥水正印为用，渴望精神共鸣，但月柱财星旺盛，又难免被物质条件或社会地位影响判断。这种拉扯可能导致你在感情中反复试探，甚至错过良缘。行为模式上，你擅长用温和的方式维系关系，但遇到压力时容易隐忍，积累到一定程度会突然爆发，造成关系裂痕。化解的关键在于平衡"感性需求"与"理性判断"，学会在包容中坚守底线。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">二、婚恋情缘</h3>
                  
                  <h4 className="text-lg font-medium text-black mb-2">早年情缘：朦胧与试探（1990-2000年，丁巳大运）</h4>
                  <p className="mb-4">
                    丁巳大运（12-22岁）的火势旺盛，冲克日支亥水夫妻宫，此阶段的情感多为"镜花水月"。1995年乙亥年，亥水伏吟日柱，引动内心对情感的渴望，可能经历暗恋或短暂暧昧，但因岁运水火相冲，无果而终。1998年戊寅年，寅木合动夫妻宫亥水，易有同学或年长者的好感，但戊土财星透干，现实差距让关系止步于朦胧。2000年庚辰年，庚金正官出现，与日干乙木相合，此年可能出现正式恋爱，但辰土与夫妻宫亥水相克，感情基础薄弱，最终因异地或学业压力分手。
                  </p>
                  
                  <h4 className="text-lg font-medium text-black mb-2">青年婚缘：现实与承诺的交织（2000-2010年，丙辰大运）</h4>
                  <p className="mb-4">
                    丙辰大运（22-32岁），丙火伤官透干，对情感要求更为挑剔。2004年甲申年，申金暗合夫妻宫亥水，甲木劫财透出，易遇到条件优越的异性，但对方可能已有伴侣或需与他人竞争，感情进展波折。2007年丁亥年，亥水伏吟日支，丁火食神制杀，此年可能通过工作结识心仪对象，关系迅速升温，甚至考虑婚嫁，但丁火克制庚金官星，双方性格摩擦逐渐显现。2008年戊子年，子水与夫妻宫亥水半合，戊土财星合身，此年易因经济问题或家庭介入导致关系紧张，最终在妥协中步入婚姻（若此前未分手）。
                  </p>
                  
                  <h4 className="text-lg font-medium text-black mb-2">中年情感：沉淀与重生（2010-2020年，乙卯大运）</h4>
                  <p className="mb-4">
                    乙卯大运（32-42岁），比肩旺盛，情感面临考验。2013年癸巳年，巳火冲克夫妻宫亥水，癸水印星透干，此年易因沟通不畅或旧事重提引发矛盾，甚至出现分居危机。2016年丙申年，申金再次合动亥水，丙火伤官透出，可能因事业发展差异或子女教育问题激化冲突，需借助长辈调解缓和。2019年己亥年，亥水伏吟加剧情绪波动，己土财星与日干相克，经济压力或财产分配问题可能成为关系转折点，部分人选择结束婚姻，另一些人则在磨合中重建信任。
                  </p>
                  
                  <h4 className="text-lg font-medium text-black mb-2">晚年归宿：淡然与相守（2020-2030年，甲寅大运）</h4>
                  <p className="mb-4">
                    甲寅大运（42-52岁），劫财透干，情感趋向务实。2022年壬寅年，寅木合动亥水，壬水印星化解甲木劫财，此年可能通过社交或旅行结识志趣相投的伴侣，关系发展平顺。2025年乙巳年，巳火再度冲击夫妻宫，但大运甲木转化火势，矛盾多能理性处理，反而增进默契。2028年戊申年，申金暗合亥水，戊土财星合身，此年关系因共同投资或家族事务协作更加稳固，晚年情感趋于平淡却深厚。
                  </p>
                  
                  <h4 className="text-lg font-medium text-black mb-2">未来启示（2030年后，癸丑大运）</h4>
                  <p className="mb-4">
                    癸丑大运（52岁后），丑土与夫妻宫亥水暗合，情感进入沉淀期。2033年癸丑年，岁运并临，丑土中辛金七杀暗藏，需注意健康问题对伴侣关系的影响，相互扶持成为主旋律。2036年丙辰年，丙火暖局，辰土水库滋养亥水，此年可能因子女成家或孙辈诞生重拾情感甜蜜，晚景温馨。纵观一生，你的情感脉络始终围绕"精神共鸣"与"现实考验"展开，早年波折铸就中年的通透，晚年的淡然则是岁月打磨的礼物。关键在于接纳情感的流动性，在每一次磨合中看清自己的核心需求，方能收获真正契合的缘分。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">三、配偶特质及助力分析</h3>
                  <p className="mb-4">
                    你的八字中，日支亥水为婚姻宫，代表与伴侣的相处模式及感情基础。亥水为乙木的印星，象征滋养与包容，说明你内心对婚姻的期待是温暖、相互支持的。亥水被月支未土克制，暗示早年感情可能因现实压力或家庭因素出现波折，但亥水本身为喜用神，最终能转化为稳定的情感能量。
                  </p>
                  <p className="mb-4">
                    配偶星为时柱的庚金正官，庚金坐辰土财库，透出天干，代表伴侣具备务实、稳重的性格，且在事业或财富积累上有较强能力。庚金与日干乙木相合（乙庚合），说明你与配偶之间具有天然的吸引力，彼此能形成互补——他善于规划与执行，你则更具包容与变通力。
                  </p>
                  <p className="mb-4">
                    性格与能力：配偶性格刚毅却不失细腻，注重规则与责任，可能在金融、管理或传统行业有所建树。辰土为财库，显示其财富管理能力突出，但需注意辰土与亥水相克（辰为水库，亥为水），双方在价值观或家庭资源分配上需磨合。
                  </p>
                  <p className="mb-4">
                    助力体现：配偶对你的助力主要体现在事业资源整合与危机处理上。庚金正官透出，象征他能在关键时刻为你提供决策支持或人脉资源。例如，若你从事演艺或商业，配偶可能在财务规划或品牌运营上给予实质性帮助。
                  </p>
                  <p className="mb-4">
                    矛盾根源：未土（月支）克亥水（日支）的结构，暗示婚姻易受外部因素干扰，如家庭责任、经济压力或长辈意见。此外，乙木日主坐亥水，你内心敏感且依赖情感共鸣，而庚金配偶更注重实际结果，双方需在"感性需求"与"理性决策"间找到平衡。
                  </p>
                  <p className="mb-4">
                    相处建议：<br/>
                    1.尊重差异：接纳彼此思维模式的不同，将他的务实与你的灵活结合，共同应对挑战。<br/>
                    2.规避冲突：遇到家庭或财务分歧时，优先明确共同目标（如子女教育、资产增值），减少细节争执。<br/>
                    3.强化沟通：定期安排深度对话，避免因忙碌疏于情感交流，可利用共同爱好（如旅行、艺术）增进默契。
                  </p>
                  <p className="mb-4">
                    若经历情感变动（如分手或再婚），后续缘分依然以"能力出众、责任感强"的类型为主，但关系会更侧重精神契合，例如对方可能从事文化、教育领域，或具有跨界背景。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">四、总结与建议</h3>
                  <p className="mb-4">
                    核心矛盾与化解：你的婚恋核心在于"理想化情感"与"现实压力"的碰撞。亥水婚姻宫为喜，赋予你滋养他人的能力，但未土克制又带来现实层面的消耗（如家庭责任、经济负担）。化解的关键在于：
                  </p>
                  <p className="mb-4">
                    明确边界：区分"自我付出"与"他人期待"，避免因过度承担牺牲个人情感需求。<br/>
                    协同成长：将伴侣视为盟友而非依赖对象，共同制定家庭目标，分工协作。
                  </p>
                  <p className="mb-4">
                    未来十年感情趋势：<br/>
                    2020-2030年甲寅大运：甲木劫财透出，需注意感情中的竞争因素（如外界诱惑或合作分歧）。2025年乙巳年，巳火冲亥水（婚姻宫），可能引发短暂矛盾，但乙庚合能缓和冲突，重点在于及时沟通。2028年戊申年，申金生亥水，感情升温，适合共同投资或规划长远事项。<br/>
                    2030年后癸丑大运：癸水润局，丑土冲未土，早年积累的压力逐渐释放，婚姻关系更趋稳定，伴侣可能在健康或养老领域提供新资源。
                  </p>
                  <p className="mb-4">
                    修炼内在：<br/>
                    增强自信：乙木柔韧，无需通过过度付出来证明自身价值。可尝试艺术创作、公益事业等，提升自我认同。<br/>
                    平衡事业与家庭：避免因工作压缩私人时间，定期与伴侣安排"无干扰"相处时段，巩固情感纽带。
                  </p>
                  <p className="mb-4">
                    终极建议：你的婚姻本质是"相互成就"。配偶的稳重能补足你的感性，而你的包容力可化解他的固执。未来十年，聚焦共同利益（如子女成长、资产配置），减少细节内耗，感情将随岁月沉淀愈发醇厚。
                  </p>
                </div>
              </section>

              {/* 身体健康主题 */}
              <section>
                <h2 className="text-2xl font-bold text-black mb-4">身体健康主题</h2>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">一、核心健康信号</h3>
                  <p className="mb-4">
                    你的八字格局中，蕴含了几项关键的健康信号，这些信号源于五行能量的平衡与互动。简单来说，就像大自然中水、木、火、土、金的和谐关系，若某方面偏弱或冲突，身体就容易出问题。我来为你逐一解读，帮你清晰理解潜在的健康趋势。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">1.肝胆系统的脆弱信号：</h4>
                  <p className="mb-4">
                    你的日柱代表自身，属于乙木（好比一棵柔韧的小树），但整个格局中土元素（如年柱戊午和月柱己未）非常旺盛，这就像土壤过重压住了树根，让树木难以茁壮成长。同时，时柱庚辰中的金元素（庚金）会克伤乙木（金克木），这可能表现为肝胆功能较弱。日常中，你容易感到疲劳、情绪波动大（如易怒或焦虑），或在压力下出现消化不良、眼睛干涩等问题。大运中，2000-2010年的丙辰运火土更旺，可能加重这种负担；但2020-2030年的甲寅运木元素增强，能提供一些支撑，整体趋向改善。然而，2025年乙巳年，巳火会冲击日柱亥水（火克水），间接削弱木的能量，今年需特别注意情绪管理和肝部健康，避免熬夜或过量饮酒。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">2.脾胃系统的压力信号：</h4>
                  <p className="mb-4">
                    格局中土元素过重（占主导），这象征脾胃的消化功能可能承受额外压力。就像土地太干硬时，植物难吸收养分，你容易出现腹胀、食欲不振或体重波动。月柱己未土旺，结合年柱戊午火生土，火上浇油，易引发体内湿热（如口臭、便秘）。大运中，1990-2000年的丁巳运火势强，可能使这种问题在年轻时更明显；而2030-2040年的癸丑运水土混杂，脾胃问题可能再次显现，需提前警惕。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">3.肾脏和泌尿系统的潜在弱点：</h4>
                  <p className="mb-4">
                    日柱亥水代表肾脏和泌尿功能，但被周围强土（未土、辰土）克制（土克水），这暗示水分代谢易受阻。你可能偶尔感到腰酸、水肿或尿频，尤其在干季或压力大时。时柱辰土虽藏一点水，但被土性掩盖，支持有限。2010-2020年乙卯运木克土，略缓解水受制；但2025年乙巳年，巳火直接冲亥水，今年更需关注肾部保养，避免过度劳累。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">4.神经系统和关节的敏感信号：</h4>
                  <p className="mb-4">
                    金元素（时柱庚金）克伤木元素，也关联神经和关节。这可能导致你容易紧张、失眠，或关节酸痛（如膝盖、手腕），尤其在天气变化时。大运中，2020-2030年甲寅运木助身，能缓冲；但若遇火旺年份（如2025乙巳年），火克金又间接生土，神经系统易波动。
                  </p>

                  <p className="mb-4">
                    总体看，你的健康核心是"木弱土旺"，需重点呵护肝胆、脾胃和肾脏。大运变迁显示，2020年后运势逐步好转，但2025年有短期波动。保持观察和预防，能大大提升生活质量。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">二、中医视角：调养之道</h3>
                  <p className="mb-4">
                    从中医角度看，你的体质偏向"肝郁脾虚、肾水不足"，这源于五行失衡。中医强调整体调和，就像园丁养护花园，需灌溉、疏土和避害。以下是针对性的调养建议，帮你打造平衡的生活方式。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">1.养肝疏郁，舒缓情绪压力：</h4>
                  <p className="mb-4">
                    肝对应木元素，你易因木弱而肝气郁结。建议多吃青色食物如菠菜、芹菜，帮助疏肝；日常可泡菊花茶或薄荷水，清肝明目。作息上，保证11点前入睡（肝经修复时），避免熬夜和情绪爆发。练习深呼吸或太极拳，缓解压力。尤其在2025乙巳年，火势冲水，更需心平气和，减少争执。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">2.健脾祛湿，强化消化功能：</h4>
                  <p className="mb-4">
                    脾胃属土，你的土旺易生湿热。饮食以清淡为主，多吃小米、南瓜健脾，避开油腻、辛辣（如火锅、烧烤），防湿气堆积。推荐喝薏米红豆粥，利湿排毒；饭后散步助消化。季节上，夏秋（火土旺时）少吃冷饮，冬春（水木稍强）可适量进补如山药汤。大运如2030年后癸丑运水土混杂，提前养成规律三餐的习惯。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">3.滋肾养水，维护水分平衡：</h4>
                  <p className="mb-4">
                    肾对应水元素，受土克需强化。多吃黑色食物如黑豆、黑芝麻，滋补肾气；常喝枸杞水或骨汤，补水养阴。避免久坐或过度出汗（如剧烈运动后及时补水），尤其在干热天。2025乙巳年，巳火冲亥水，肾易虚，可做温和运动如游泳或瑜伽，保持体液循环。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">4.整体避火，调和身心：</h4>
                  <p className="mb-4">
                    火旺生土，易致上火（如口干、痘痘）。建议少接触高温环境（如桑拿），多饮水或绿豆汤清热。情绪上，培养爱好如读书或园艺，转移焦躁。结合季节，春季（木旺）多户外活动，夏季（火旺）注意防晒降温。
                  </p>

                  <p className="mb-4">
                    通过这些方法，你能逐步增强体质。记住，中医调养贵在坚持，每年春季和秋季做一次身体评估，顺应自然节奏。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">三、西医视角：预防重点</h3>
                  <p className="mb-4">
                    从西医科学出发，你的健康信号可转化为具体风险点，需针对性预防。西医强调早期筛查和生活方式管理，帮助你避开疾病。以下是基于八字趋势的实用建议。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">1.肝胆系统筛查与日常防护：</h4>
                  <p className="mb-4">
                    肝胆脆弱易引发肝炎或胆囊问题。建议每年做一次肝功能检查（如ALT、AST指标），特别在压力大时。饮食上，控制脂肪摄入（如少吃油炸食品），戒烟限酒（酒精伤肝）。2025乙巳年，火势影响神经，更需监测血压，避免情绪诱发的肝部不适。若有家族病史，40岁后加做超声检查。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">2.消化系统监控与习惯优化：</h4>
                  <p className="mb-4">
                    脾胃压力高风险包括胃炎或肠易激综合征。定期做肠胃镜（建议每3-5年一次），关注消化不良症状如反酸、便秘。饮食规律，多纤维（如全麦面包、蔬菜），少吃加工食品。结合大运，2010-2020年乙卯运木克土时消化较好，但2030年后癸丑运水土乱，易便秘，可补充益生菌。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">3.肾脏和泌尿健康维护：</h4>
                  <p className="mb-4">
                    肾水不足可能导致结石或尿路感染。每年尿常规检查必不可少，留意尿频或腰痛。多喝水（每天1.5-2升），少盐饮食（防肾负担）。2025乙巳年，火冲水肾虚，避免久坐或憋尿，加强下半身锻炼如深蹲。50岁后加查肾功能（如肌酐指标）。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">4.神经和关节预防措施：</h4>
                  <p className="mb-4">
                    神经系统敏感易致失眠或焦虑，关节问题如关节炎。每年体检包括骨密度测试，尤其女性更年期前后。运动以低冲击为主（如游泳、骑自行车），避负重。压力管理是关键：尝试认知行为疗法或冥想APP。2025年，火金相克，神经易紧张，保证7-8小时睡眠，用薰衣草精油助眠。
                  </p>

                  <p className="mb-4">
                    综合来看，预防是核心。40岁后，重点关注上述系统，结合大运趋势（如2020年后甲寅运好转），能有效降低风险。2025年是个关键节点，建议全面体检，早发现早干预。通过中西医结合，你能掌握主动，拥抱健康生活。
                  </p>
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">四、情志影响与修心之法</h3>
                  <p className="mb-4">
                    你天生心思细腻，容易反复思考问题（土过旺的特性），常因过度思虑导致精神紧张。这种情绪会直接影响脾胃功能，引发消化不良、腹胀或食欲不振。同时，水弱（肾气不足）会让你在压力下产生不安感，长期积累可能导致失眠、腰酸或精力衰退。木弱（肝胆不足）则表现为情绪波动，时而压抑、时而急躁，影响肝脏疏泄功能。修心养性的核心方法：
                  </p>

                  <p className="mb-4">
                    1.释放思虑：每天固定15分钟静坐或冥想，想象烦恼随水流走（增强水气）。<br/>
                    2.化解焦虑：接触自然绿植（如养盆栽、散步公园），木气能舒缓肝郁；睡前用温水泡脚（加少许盐），滋补肾气。<br/>
                    3.情绪疏导：通过写日记、轻音乐（流水声或钢琴曲）释放压力，避免生闷气伤肝。
                  </p>

                  <p className="mb-4">
                    自我疗愈技巧：<br/>
                    按摩太冲穴（脚背大趾与二趾间）疏解郁气，按压涌泉穴（脚底前凹陷处）安神。<br/>
                    饮食同步：常喝菊花枸杞茶（清肝火），小米粥（养脾胃）。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">五、未来30年健康重点</h3>
                  <p className="mb-4">未来健康需分阶段调理，核心是平衡土、水、木三者：</p>

                  <h4 className="text-lg font-medium text-black mb-2">1. 2020-2030年（当前甲寅大运）</h4>
                  <p className="mb-4">
                    <strong>风险点：</strong>土克水加重（易肾虚、泌尿问题），木气被争夺（肝胆疲劳、眼睛干涩）。
                  </p>
                  <p className="mb-4">
                    <strong>饮食重点：</strong><br/>
                    补肾：黑豆、黑芝麻、海带（每周3次）。<br/>
                    护肝：菠菜、芹菜、绿豆汤（忌油炸辛辣）。<br/>
                    健脾：山药、南瓜（避免生冷伤胃）。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">2. 2030-2040年（癸丑大运）</h4>
                  <p className="mb-4">
                    <strong>风险点：</strong>湿土淤积（关节酸痛、水肿），肾水受抑（腰膝无力）。
                  </p>
                  <p className="mb-4">
                    <strong>饮食调整：</strong><br/>
                    祛湿：薏米红豆粥、生姜茶。<br/>
                    温肾：桂圆红枣汤、羊肉（冬季适量）。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">3. 2040-2050年（壬子大运）</h4>
                  <p className="mb-4">
                    <strong>风险点：</strong>水势过旺（易寒湿入体、血压波动）。
                  </p>
                  <p className="mb-4">
                    <strong>饮食关键：</strong><br/>
                    驱寒：花椒炖汤、肉桂粉调味。<br/>
                    护心：燕麦、山楂（减少盐分）。
                  </p>

                  <p className="mb-4">
                    长期原则：三餐定时七分饱，饮温水（每日1.5升），适度散步或游泳（忌剧烈运动）。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">六、意外伤灾与关键年份</h3>
                  <p className="mb-4">你需警惕两类意外：</p>

                  <p className="mb-4">
                    1.土相关：跌伤、肌肉拉伤（土旺骨弱）。<br/>
                    2.水火相冲：烫伤、交通碰撞（火动冲水）。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">未来十年高危年份：</h4>
                  <p className="mb-4">
                    <strong>2025乙巳年：</strong>水火激烈冲突（巳火冲亥水），注意车辆安全、避免高温作业，并防范急性泌尿感染。<br/>
                    <strong>2027丁未年：</strong>土势叠加，慎防食物中毒、工地风险，脾胃突发不适。<br/>
                    <strong>2030庚戌年：</strong>土气动荡（辰戌相冲），远离高空、陡坡，检查房屋结构安全。
                  </p>

                  <h4 className="text-lg font-medium text-black mb-2">日常防护：</h4>
                  <p className="mb-4">
                    驾车系安全带，避免深夜出行。<br/>
                    厨房用防烫手套，定期检查电器线路。
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-black mb-3">七、总结</h3>
                  <p className="mb-4">
                    你的健康核心在于"水土平衡"与"情绪疏导"。未来30年需分阶段养护：当前十年重点补肾护肝，2030年后转向祛湿温阳，2040年起注重心血管养护。高危年份（2025、2027、2030）务必加强防护。通过饮食调理（黑色食物补肾、绿色蔬菜养肝）、适度运动（游泳、散步）及情绪管理（静坐、音乐），可显著提升体质。记住，心态平和是健康根基——思虑放下几分，元气便增长几分。
                  </p>
                </div>
              </section>

            </div>

            {/* 返回按钮 */}
            <div className="mt-12 text-center">
              <Link href="/products/case-liutao-part2">
                <button className="btn-secondary px-8 py-3 mr-4">
                  返回第二部分
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
                © 2024 天乙神算. 保留所有权利.
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
