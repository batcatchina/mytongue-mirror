// MCP协议路由 - 舌镜辨证能力引擎
// 支持 JSON-RPC 2.0 协议
// ESM格式（全内联版本 - 兼容Vercel Serverless Function）
// ==================== 穴位数据 ====================

// 常用穴位经脉归属映射
const ACUPOINT_MERIDIAN_MAP = {
  // 任脉
  '关元': '任脉',
  '气海': '任脉',
  '中脘': '任脉',
  '神阙': '任脉',
  '膻中': '任脉',
  '中极': '任脉',
  '下脘': '任脉',
  '上脘': '任脉',
  '巨阙': '任脉',
  '鸠尾': '任脉',
  
  // 足阳明胃经
  '足三里': '足阳明胃经',
  '天枢': '足阳明胃经',
  '梁丘': '足阳明胃经',
  '犊鼻': '足阳明胃经',
  '上巨虚': '足阳明胃经',
  '下巨虚': '足阳明胃经',
  '丰隆': '足阳明胃经',
  '解溪': '足阳明胃经',
  '冲阳': '足阳明胃经',
  '内庭': '足阳明胃经',
  
  // 足太阴脾经
  '三阴交': '足太阴脾经',
  '阴陵泉': '足太阴脾经',
  '血海': '足太阴脾经',
  '地机': '足太阴脾经',
  '商丘': '足太阴脾经',
  '公孙': '足太阴脾经',
  '太白': '足太阴脾经',
  '隐白': '足太阴脾经',
  
  // 手太阴肺经
  '尺泽': '手太阴肺经',
  '孔最': '手太阴肺经',
  '列缺': '手太阴肺经',
  '经渠': '手太阴肺经',
  '太渊': '手太阴肺经',
  '鱼际': '手太阴肺经',
  '少商': '手太阴肺经',
  
  // 手阳明大肠经
  '合谷': '手阳明大肠经',
  '曲池': '手阳明大肠经',
  '手三里': '手阳明大肠经',
  '偏历': '手阳明大肠经',
  '温溜': '手阳明大肠经',
  '肩髃': '手阳明大肠经',
  '迎香': '手阳明大肠经',
  
  // 足太阳膀胱经
  '委中': '足太阳膀胱经',
  '承山': '足太阳膀胱经',
  '昆仑': '足太阳膀胱经',
  '申脉': '足太阳膀胱经',
  '至阴': '足太阳膀胱经',
  '肾俞': '足太阳膀胱经',
  '肝俞': '足太阳膀胱经',
  '脾俞': '足太阳膀胱经',
  '胃俞': '足太阳膀胱经',
  '肺俞': '足太阳膀胱经',
  '心俞': '足太阳膀胱经',
  '膈俞': '足太阳膀胱经',
  '胆俞': '足太阳膀胱经',
  '大肠俞': '足太阳膀胱经',
  '膀胱俞': '足太阳膀胱经',
  '秩边': '足太阳膀胱经',
  '天宗': '足太阳膀胱经',
  
  // 足少阴肾经
  '太溪': '足少阴肾经',
  '涌泉': '足少阴肾经',
  '照海': '足少阴肾经',
  '复溜': '足少阴肾经',
  '阴谷': '足少阴肾经',
  '大钟': '足少阴肾经',
  '水泉': '足少阴肾经',
  
  // 手厥阴心包经
  '内关': '手厥阴心包经',
  '曲泽': '手厥阴心包经',
  '间使': '手厥阴心包经',
  '郄门': '手厥阴心包经',
  '大陵': '手厥阴心包经',
  '劳宫': '手厥阴心包经',
  '中冲': '手厥阴心包经',
  
  // 手少阳三焦经
  '外关': '手少阳三焦经',
  '支沟': '手少阳三焦经',
  '肩髎': '手少阳三焦经',
  '翳风': '手少阳三焦经',
  '耳门': '手少阳三焦经',
  '丝竹空': '手少阳三焦经',
  
  // 足少阳胆经
  '阳陵泉': '足少阳胆经',
  '风池': '足少阳胆经',
  '肩井': '足少阳胆经',
  '环跳': '足少阳胆经',
  '风市': '足少阳胆经',
  '光明': '足少阳胆经',
  '悬钟': '足少阳胆经',
  '丘墟': '足少阳胆经',
  '足临泣': '足少阳胆经',
  '侠溪': '足少阳胆经',
  
  // 足厥阴肝经
  '太冲': '足厥阴肝经',
  '行间': '足厥阴肝经',
  '曲泉': '足厥阴肝经',
  '蠡沟': '足厥阴肝经',
  '章门': '足厥阴肝经',
  '期门': '足厥阴肝经',
  
  // 手少阴心经
  '神门': '手少阴心经',
  '少府': '手少阴心经',
  '通里': '手少阴心经',
  '阴郄': '手少阴心经',
  '灵道': '手少阴心经',
  '少海': '手少阴心经',
  '极泉': '手少阴心经',
  
  // 督脉
  '百会': '督脉',
  '大椎': '督脉',
  '命门': '督脉',
  '至阳': '督脉',
  '长强': '督脉',
  '腰阳关': '督脉',
  '风府': '督脉',
  '印堂': '督脉',
  '水沟': '督脉',
  
  // 经外奇穴
  '太阳': '经外奇穴',
  '十宣': '经外奇穴',
  '四缝': '经外奇穴',
  '胆囊穴': '经外奇穴',
  '阑尾穴': '经外奇穴',
  '八风': '经外奇穴',
  '八邪': '经外奇穴',
  '安眠': '经外奇穴',
};

// 穴位功效映射
const ACUPOINT_EFFECT_MAP = {
  '关元': '培元固本、补益下焦',
  '气海': '益气助阳、调经固经',
  '中脘': '和胃健脾、降逆利水',
  '神阙': '回阳救逆、健脾和胃',
  '膻中': '理气宽胸、清肺止咳',
  '中极': '补肾培元、调经止带',
  '下脘': '健脾和胃、降逆止呕',
  '上脘': '和胃降逆、化痰宁神',
  '巨阙': '和胃降逆、化痰宁神',
  '鸠尾': '和胃降逆、清热息风',
  '足三里': '健脾和胃、扶正培元',
  '天枢': '理气健脾、调经止带',
  '梁丘': '理气和胃、通经活络',
  '犊鼻': '祛风除湿、通经活络',
  '上巨虚': '理气降浊、调和肠胃',
  '下巨虚': '理气降浊、调和肠胃',
  '丰隆': '和胃降逆、化痰开窍',
  '解溪': '清胃降逆、舒筋活络',
  '冲阳': '和胃降逆、通经活络',
  '内庭': '清胃降逆、清热利湿',
  '三阴交': '健脾益血、调肝补肾',
  '阴陵泉': '健脾利湿、通利下焦',
  '血海': '活血化瘀、健脾利湿',
  '地机': '健脾利湿、调经止带',
  '商丘': '健脾利湿、和胃降逆',
  '公孙': '健脾和胃、理气止痛',
  '太白': '健脾和胃、理气止痛',
  '隐白': '健脾止血、调经止带',
  '尺泽': '清热降逆、止咳平喘',
  '孔最': '清热止血、止咳平喘',
  '列缺': '宣肺止咳、通经活络',
  '经渠': '宣肺止咳、疏风解表',
  '太渊': '宣肺止咳、益气通脉',
  '鱼际': '清热利咽、止咳平喘',
  '少商': '清热利咽、开窍醒神',
  '合谷': '镇静止痛、通经活络',
  '曲池': '清热解表、调和气血',
  '手三里': '通经活络、清热明目',
  '偏历': '清热利尿、通经活络',
  '温溜': '清热和胃、理气止痛',
  '肩髃': '通经活络、祛风除湿',
  '迎香': '通鼻窍、散风热',
  '委中': '清热利湿、舒筋活络',
  '承山': '理气止痛、舒筋活络',
  '昆仑': '理气止痛、清热安神',
  '申脉': '清热利湿、安神定志',
  '至阴': '理气活血、清头明目',
  '肾俞': '补肾益精、强腰利水',
  '肝俞': '疏肝利胆、理气明目',
  '脾俞': '健脾利湿、和胃降逆',
  '胃俞': '和胃降逆、理气止痛',
  '肺俞': '宣肺止咳、降逆平喘',
  '心俞': '宁心安神、宽胸理气',
  '膈俞': '理气宽胸、活血止血',
  '胆俞': '疏肝利胆、清热利湿',
  '大肠俞': '理气通腑、清热利湿',
  '膀胱俞': '清热利湿、通利下焦',
  '秩边': '理气止痛、舒筋活络',
  '天宗': '理气止痛、舒筋活络',
  '太溪': '滋肾阴、补肾气',
  '涌泉': '苏厥开窍、滋阴益肾',
  '照海': '滋阴益肾、清热利湿',
  '复溜': '补肾益气、清热利尿',
  '阴谷': '益肾助阳、理气止痛',
  '大钟': '益肾清热、调和经气',
  '水泉': '益肾清热、调经止带',
  '内关': '宁心安神、理气止痛',
  '间使': '清热利湿、宁心安神',
  '郄门': '宁心安神、清热止血',
  '大陵': '宁心安神、清热和胃',
  '劳宫': '清热开窍、安神醒脑',
  '中冲': '清热开窍、苏厥醒神',
  '外关': '清热解表、通经活络',
  '支沟': '清热通腑、理气止痛',
  '肩髎': '通经活络、祛风除湿',
  '翳风': '聪耳通窍、祛风泄热',
  '耳门': '通气开窍、清热泻火',
  '丝竹空': '清热明目、祛风通络',
  '阳陵泉': '疏肝利胆、清热利湿',
  '风池': '疏风清热、明目益聪',
  '肩井': '理气豁痰、活络止痛',
  '环跳': '祛风除湿、通经活络',
  '风市': '祛风除湿、通经活络',
  '光明': '清肝明目、通络止痛',
  '悬钟': '补髓壮骨、清热通络',
  '丘墟': '理气疏肝、清热利胆',
  '足临泣': '理气疏肝、清热明目',
  '侠溪': '清热利湿、祛风通络',
  '太冲': '疏肝解郁、理气调血',
  '行间': '疏肝理气、清热利湿',
  '曲泉': '疏肝理气、清热利湿',
  '蠡沟': '疏肝理气、调经止带',
  '章门': '疏肝健脾、理气消痞',
  '期门': '疏肝理气、健脾和胃',
  '神门': '宁心安神、清心热',
  '少府': '清心泻火、活血行气',
  '通里': '宁心安神、清心开窍',
  '阴郄': '宁心安神、清热止血',
  '灵道': '宁心安神、通经活络',
  '少海': '清心泻火、舒筋活络',
  '极泉': '清心泻火、舒筋活络',
  '百会': '升阳举陷、安神醒脑',
  '大椎': '解表清热、截疟止痫',
  '命门': '补肾壮阳、强腰利水',
  '至阳': '理气宽胸、清热利胆',
  '长强': '清热利湿、固脱止泻',
  '腰阳关': '补肾壮阳、强腰利湿',
  '风府': '祛风清热、通关开窍',
  '印堂': '清热明目、安神定惊',
  '水沟': '清热开窍、苏厥救逆',
  '太阳': '清热明目、祛风止痛',
  '十宣': '清热开窍、苏厥醒神',
  '四缝': '健脾消积、清热除烦',
  '胆囊穴': '疏肝利胆、清热利湿',
  '阑尾穴': '清热通腑、理气止痛',
  '八风': '祛风除湿、清热解毒',
  '八邪': '清热解毒、通络止痛',
  '安眠': '镇静安神、平肝潜阳',
  '曲泽': '清热除烦、止咳平喘',
};

// 穴位定位映射
const ACUPOINT_LOCATION_MAP = {
  '关元': '下腹部，脐中下3寸，前正中线上',
  '气海': '下腹部，脐中下1.5寸，前正中线上',
  '中脘': '上腹部，脐中上4寸，前正中线上',
  '神阙': '腹中部，脐中央',
  '膻中': '胸部，平第4肋间隙，前正中线上',
  '中极': '下腹部，脐中下4寸，前正中线上',
  '下脘': '上腹部，脐中上2寸，前正中线上',
  '上脘': '上腹部，脐中上5寸，前正中线上',
  '巨阙': '上腹部，脐中上6寸，前正中线上',
  '鸠尾': '上腹部，剑胸结合部下1寸，前正中线上',
  '足三里': '小腿外侧，犊鼻下3寸，胫骨前嵴旁开1横指',
  '天枢': '腹部，脐中旁开2寸',
  '梁丘': '大腿前区，髌底上2寸，股外侧肌与股直肌之间',
  '犊鼻': '膝前区，髌韧带外侧凹陷中',
  '上巨虚': '小腿外侧，犊鼻下6寸，足三里与下巨虚连线中点',
  '下巨虚': '小腿外侧，犊鼻下9寸，上巨虚下3寸',
  '丰隆': '小腿外侧，外踝尖上8寸，胫骨前肌外缘',
  '解溪': '踝区，踝关节前面中央凹陷中',
  '冲阳': '足背，第2跖骨基底部与中间楔骨之间',
  '内庭': '足背，第2、3趾间，趾蹼缘后方赤白肉际处',
  '三阴交': '小腿内侧，内踝尖上3寸，胫骨内侧缘后际',
  '阴陵泉': '小腿内侧，胫骨内侧髁下缘与胫骨内侧缘之间',
  '血海': '股前区，髌底内侧端上2寸，股内侧肌隆起处',
  '地机': '小腿内侧，阴陵泉下3寸，胫骨内侧缘后际',
  '商丘': '踝区，内踝前下方，舟骨粗隆与内踝尖连线中点',
  '公孙': '足内侧，第1跖骨底的前下缘赤白肉际处',
  '太白': '足内侧，第1跖趾关节后下方赤白肉际凹陷中',
  '隐白': '足趾，大趾末节内侧，趾甲根角侧后方0.1寸',
  '尺泽': '肘区，肘横纹上，肱二头肌腱桡侧缘凹陷中',
  '孔最': '前臂前区，腕掌侧远端横纹上7寸，尺泽与太渊连线上',
  '列缺': '前臂，腕掌侧远端横纹上1.5寸',
  '经渠': '前臂前区，腕掌侧远端横纹上1寸',
  '太渊': '腕前区，腕掌侧远端横纹上，桡骨茎突与舟状骨之间',
  '鱼际': '手拇指，第1掌指关节后凹陷处',
  '少商': '手指，拇指末节桡侧，指甲根角侧上方0.1寸',
  '合谷': '手背，第1、2掌骨间，第2掌骨桡侧中点处',
  '曲池': '肘区，肘横纹尽头处，肱骨外上髁内缘凹陷中',
  '手三里': '前臂，肘横纹下2寸，阳溪与曲池连线上',
  '偏历': '前臂，腕背侧远端横纹上3寸，阳溪与曲池连线上',
  '温溜': '前臂，腕背侧远端横纹上5寸，阳溪与曲池连线上',
  '肩髃': '肩部，肩峰外侧缘前端与肱骨大结节之间的凹陷中',
  '迎香': '面部，鼻翼外缘中点旁，鼻唇沟中',
  '委中': '膝后区，腘横纹中点，股二头肌腱内侧',
  '承山': '小腿后区，腓肠肌两肌腹交界下端凹陷处',
  '昆仑': '踝区，外踝尖与跟腱之间的凹陷中',
  '申脉': '踝区，外踝尖直下，外踝下缘与跟骨之间凹陷中',
  '至阴': '足趾，小趾末节外侧，趾甲根角侧后方0.1寸',
  '肾俞': '腰部，第2腰椎棘突下，后正中线旁开1.5寸',
  '肝俞': '背部，第9胸椎棘突下，后正中线旁开1.5寸',
  '脾俞': '背部，第11胸椎棘突下，后正中线旁开1.5寸',
  '胃俞': '背部，第12胸椎棘突下，后正中线旁开1.5寸',
  '肺俞': '背部，第3胸椎棘突下，后正中线旁开1.5寸',
  '心俞': '背部，第5胸椎棘突下，后正中线旁开1.5寸',
  '膈俞': '背部，第7胸椎棘突下，后正中线旁开1.5寸',
  '胆俞': '背部，第10胸椎棘突下，后正中线旁开1.5寸',
  '大肠俞': '腰部，第4腰椎棘突下，后正中线旁开1.5寸',
  '膀胱俞': '骶部，横平第2骶后孔，督脉旁开1.5寸',
  '秩边': '骶部，横平第4骶后孔，督脉旁开3寸',
  '天宗': '肩胛区，肩胛冈中点与肩胛骨下角连线上1/3下折点处',
  '太溪': '踝区，内踝尖与跟腱之间的凹陷中',
  '涌泉': '足底，屈足卷趾时足心最凹陷处',
  '照海': '踝区，内踝尖下1寸，内踝下方凹陷中',
  '复溜': '小腿内侧，内踝尖上2寸，跟腱前缘',
  '阴谷': '膝后区，腘横纹内侧端，半腱肌腱内侧',
  '大钟': '跟区，内踝后下方，跟骨上缘，跟腱附着部内侧',
  '水泉': '跟区，太溪直下1寸，跟骨结节内侧凹陷中',
  '内关': '前臂前区，腕掌侧远端横纹上2寸，掌长肌腱与桡侧腕屈肌腱之间',
  '曲泽': '肘前区，肘横纹上，肱二头肌腱内侧凹陷中',
  '间使': '前臂前区，腕掌侧远端横纹上3寸，掌长肌腱与桡侧腕屈肌腱之间',
  '郄门': '前臂前区，腕掌侧远端横纹上5寸，掌长肌腱与桡侧腕屈肌腱之间',
  '大陵': '腕前区，腕掌侧远端横纹中，掌长肌腱与桡侧腕屈肌腱之间',
  '劳宫': '掌区，中指及无名指屈曲时指尖所指掌心凹陷处',
  '中冲': '手指，中指末端最高点',
  '外关': '前臂后区，腕背侧远端横纹上2寸，尺骨与桡骨之间',
  '支沟': '前臂后区，腕背侧远端横纹上3寸，尺骨与桡骨之间',
  '肩髎': '肩部，肩峰外侧端后缘许，三角肌后缘凹陷中',
  '翳风': '颈部，耳垂后方，乳突下端前方凹陷中',
  '耳门': '耳区，耳屏上切迹与下颌骨髁突之间的凹陷中',
  '丝竹空': '面部，眉梢外端凹陷中',
  '阳陵泉': '小腿外侧，腓骨头前下方凹陷中',
  '风池': '颈后区，枕骨胸锁乳突肌上端与斜方肌上端之间凹陷中',
  '肩井': '肩胛区，第7颈椎棘突与肩峰最外侧点连线中点',
  '环跳': '臀区，侧卧屈股，股骨大转子最凸点与骶管裂孔连线外1/3处',
  '风市': '股部，大腿外侧，腘横纹上7寸，股外侧肌与股二头肌之间',
  '光明': '小腿外侧，外踝尖上5寸，腓骨前缘',
  '悬钟': '小腿外侧，外踝尖上3寸，腓骨前缘',
  '丘墟': '踝区，外踝前下方，趾长伸肌腱外侧凹陷中',
  '足临泣': '足背，第4、5跖骨底结合部前方，第5趾长伸肌腱外侧凹陷中',
  '侠溪': '足背，第4、5趾间，趾蹼缘后方赤白肉际处',
  '太冲': '足背，第1、2跖骨间，跖骨底结合部前方凹陷中',
  '行间': '足背，第1、2趾间，趾蹼缘后方赤白肉际处',
  '曲泉': '膝部，腘横纹内侧端，半腱肌腱内侧凹陷中',
  '蠡沟': '小腿内侧，内踝尖上5寸，胫骨内侧缘中央',
  '章门': '侧腹部，第11肋游离端下方',
  '期门': '胸部，第4肋间隙，前正中线旁开4寸',
  '神门': '腕前区，腕掌侧远端横纹上，豌豆骨桡侧凹陷中',
  '少府': '手掌，横纹上，第5掌指关节近端，第4、5掌骨之间',
  '通里': '前臂前区，腕掌侧远端横纹上1寸，尺侧腕屈肌腱桡侧缘',
  '阴郄': '前臂前区，腕掌侧远端横纹上0.5寸，尺侧腕屈肌腱桡侧缘',
  '灵道': '前臂前区，腕掌侧远端横纹上1.5寸，尺侧腕屈肌腱桡侧缘',
  '少海': '肘前区，肘横纹内侧端，肱骨内上髁前缘',
  '极泉': '腋窝，腋动脉搏动处',
  '百会': '头部，前发际正中直上5寸',
  '大椎': '颈后区，第7颈椎棘突下凹陷中',
  '命门': '腰部，第2腰椎棘突下凹陷中',
  '至阳': '背下部，第7胸椎棘突下凹陷中',
  '长强': '会阴区，尾骨下方，尾骨端与肛门连线中点',
  '腰阳关': '腰部，第4腰椎棘突下凹陷中',
  '风府': '颈后区，枕外隆凸直下，两侧斜方肌之间凹陷中',
  '印堂': '头部，两眉毛内侧端连线中点',
  '水沟': '面部，人中沟上1/3与中1/3交界处',
  '太阳': '头部，眉梢与目外眦之间，向后约1寸凹陷中',
  '十宣': '手指，十指尖端，距指甲游离缘0.1寸',
  '四缝': '手指，第2-5指掌侧指间关节横纹中点',
  '胆囊穴': '小腿外侧，腓骨小头直下2寸',
  '阑尾穴': '小腿外侧，犊鼻下5寸，胫骨前缘旁开1横指',
  '八风': '足背，第1-5趾间，趾蹼缘后方赤白肉际处',
  '八邪': '手背，第1-5指间，指蹼缘后方赤白肉际处',
  '安眠': '项部，翳风与风池连线中点',
};

// 穴位主治映射
const ACUPOINT_INDICATIONS_MAP = {
  '关元': '遗尿、尿频、遗精、阳痿、月经不调、痛经、虚劳',
  '气海': '腹痛、泄泻、便秘、遗尿、遗精、阳痿、月经不调、虚脱',
  '中脘': '胃痛、呕吐、腹胀、呃逆、纳呆、疳积、黄疸',
  '神阙': '腹痛、泄泻、脱肛、水肿、虚脱',
  '膻中': '胸闷、气短、心悸、咳嗽、气喘、乳少',
  '中极': '遗尿、尿频、尿闭、遗精、阳痿、月经不调、带下',
  '下脘': '胃痛、呕吐、呃逆、腹胀、食不化',
  '上脘': '胃痛、呕吐、呃逆、腹胀、癫痫',
  '巨阙': '胸痛、心悸、呕吐、呃逆、癫狂痫',
  '鸠尾': '胸闷、心悸、呕吐、呃逆、癫痫',
  '足三里': '胃痛、呕吐、腹胀、泄泻、便秘、虚劳',
  '天枢': '腹胀、肠鸣、泄泻、便秘、月经不调、痛经',
  '梁丘': '胃痛、膝肿、下肢不遂、乳痈',
  '犊鼻': '膝痛、屈伸不利、脚气',
  '上巨虚': '肠鸣、腹痛、泄泻、便秘、肠痈',
  '下巨虚': '小腹痛、泄泻、痢疾、乳痈、下肢痿痹',
  '丰隆': '头痛、眩晕、咳嗽、痰多、呕吐、便秘、癫狂痫',
  '解溪': '头痛、眩晕、癫狂、腹胀、便秘、下肢痿痹',
  '冲阳': '口眼歪斜、面肿、齿痛、胃痛、足痿',
  '内庭': '齿痛、咽喉肿痛、口歪、鼻衄、胃痛、便秘',
  '三阴交': '月经不调、痛经、崩漏、带下、遗精、阳痿、失眠',
  '阴陵泉': '腹胀、泄泻、水肿、黄疸、小便不利、遗尿',
  '血海': '月经不调、痛经、崩漏、瘾疹、湿疹',
  '地机': '腹痛、泄泻、水肿、小便不利、痛经、月经不调',
  '商丘': '腹胀、泄泻、便秘、黄疸、足踝痛',
  '公孙': '胃痛、呕吐、腹痛、泄泻、痢疾',
  '太白': '胃痛、腹胀、泄泻、便秘、体重节痛',
  '隐白': '月经过多、崩漏、便血、尿血、癫狂',
  '尺泽': '咳嗽、气喘、咳血、咽喉肿痛、肘臂挛痛',
  '孔最': '咳嗽、气喘、咳血、咽喉肿痛、肘臂挛痛',
  '列缺': '咳嗽、气喘、咽喉肿痛、偏正头痛、项强',
  '经渠': '咳嗽、气喘、胸痛、咽喉肿痛、手腕痛',
  '太渊': '咳嗽、气喘、咳血、胸痛、咽喉肿痛、无脉症',
  '鱼际': '咳嗽、咳血、咽喉肿痛、失音、发热',
  '少商': '咽喉肿痛、咳嗽、鼻衄、发热、昏迷、癫狂',
  '合谷': '头痛、齿痛、目赤肿痛、咽喉肿痛、口歪、发热',
  '曲池': '咽喉肿痛、齿痛、目赤肿痛、瘾疹、热病',
  '手三里': '齿痛、颊肿、瘰疬、腹胀、泄泻',
  '偏历': '耳鸣、鼻衄、喉痛、腹胀、水肿',
  '温溜': '头痛、咽喉肿痛、肠鸣、腹痛',
  '肩髃': '肩臂挛痛、瘾疹、瘰疬',
  '迎香': '鼻塞、鼻衄、口歪、面痒',
  '委中': '腰背痛、腘筋挛急、下肢痿痹、腹痛、吐泻',
  '承山': '腰背痛、腿痛、便秘、脱肛',
  '昆仑': '头痛、项强、目眩、鼻衄、腰骶疼痛',
  '申脉': '头痛、眩晕、失眠、癫狂痫、项强、腰腿痛',
  '至阴': '头痛、目痛、鼻塞、鼻衄、胎位不正、难产',
  '肾俞': '遗精、阳痿、月经不调、腰痛、耳鸣、水肿',
  '肝俞': '胁痛、黄疸、目赤、目眩、癫狂痫',
  '脾俞': '腹胀、泄泻、呕吐、胃痛、乏力',
  '胃俞': '胃脘痛、呕吐、腹胀、肠鸣',
  '肺俞': '咳嗽、气喘、咯血、鼻塞、发热、盗汗',
  '心俞': '心痛、心悸、失眠、健忘、癫狂痫',
  '膈俞': '呕吐、呃逆、咳嗽、气喘、盗汗、吐血',
  '胆俞': '黄疸、胁痛、呕吐、口苦、潮热',
  '大肠俞': '腰痛、腹胀、泄泻、便秘',
  '膀胱俞': '遗尿、遗精、阳痿、月经不调、带下、腰痛',
  '秩边': '腰骶痛、下肢痿痹、小便不利、便秘',
  '天宗': '肩胛痛、肘臂痛、瘰疬',
  '太溪': '月经不调、遗精、阳痿、咳嗽、气喘、头痛',
  '涌泉': '头痛、眩晕、失眠、便秘、咽喉肿痛、足心热',
  '照海': '月经不调、痛经、带下、咽喉干痛、失眠',
  '复溜': '水肿、汗证、腹胀、泄泻、腰脊强痛',
  '阴谷': '阳痿、遗精、月经不调、崩漏、膝痛',
  '大钟': '痴呆、嗜卧、咯血、呕吐、便秘、足跟痛',
  '水泉': '月经不调、痛经、闭经、崩漏、小便不利',
  '内关': '心痛、心悸、胸闷、胃痛、呕吐、失眠',
  '曲泽': '心痛、心悸、胃痛、呕吐、发热、烦躁',
  '间使': '心痛、心悸、胃痛、呕吐、癫狂痫、热病',
  '郄门': '心痛、心悸、呕血、咯血、癫狂痫',
  '大陵': '心痛、心悸、胃痛、呕吐、癫狂痫',
  '劳宫': '心痛、呕吐、癫狂痫、口疮、口臭',
  '中冲': '心痛、昏迷、舌强肿痛、发热',
  '外关': '热病、头痛、颊痛、耳鸣、耳聋、瘰疬',
  '支沟': '便秘、热病、胁肋痛、耳鸣、耳聋、暴喑',
  '肩髎': '肩臂痛、瘾疹、瘰疬',
  '翳风': '耳鸣、耳聋、口眼歪斜、牙关紧闭、颊肿',
  '耳门': '耳鸣、耳聋、齿痛、颊肿',
  '丝竹空': '头痛、眩晕、齿痛、口眼歪斜、癫痫',
  '阳陵泉': '胁痛、口苦、呕吐、下肢痿痹、膝肿',
  '风池': '头痛、眩晕、失眠、颈项强痛、鼻塞',
  '肩井': '肩背疼痛、上肢不遂、颈项强痛、瘰疬',
  '环跳': '腰腿痛、下肢痿痹、半身不遂',
  '风市': '下肢痿痹、遍身瘙痒、脚气',
  '光明': '目痛、夜盲、近视、乳胀',
  '悬钟': '项强、胸胁胀痛、下肢痿痹、咽喉肿痛',
  '丘墟': '胸胁胀痛、下肢痿痹、外踝肿痛',
  '足临泣': '偏头痛、目眩、瘰疬、胁肋痛、足跗肿痛',
  '侠溪': '头痛、眩晕、目赤肿痛、耳鸣、胁肋疼痛',
  '太冲': '头痛、眩晕、目赤肿痛、胁痛、疝气、崩漏',
  '行间': '头痛、眩晕、目赤肿痛、口歪、胁痛、疝气',
  '曲泉': '小腹痛、小便不利、遗精、阳痿、月经不调',
  '蠡沟': '月经不调、带下、阴痒、疝气、遗尿',
  '章门': '腹痛、腹胀、泄泻、胁痛、痞块',
  '期门': '胸胁胀痛、呕吐、呃逆、腹胀',
  '神门': '心痛、心烦、惊悸、失眠、健忘、癫狂痫',
  '少府': '心悸、胸痛、小便不利、阴痒、掌中热',
  '通里': '心悸、怔忡、暴喑、舌强不语、腕臂痛',
  '阴郄': '心痛、心悸、盗汗、吐血、衄血',
  '灵道': '心痛、悲恐、暴喑、瘛疭、肘臂挛痛',
  '少海': '心痛、腋胁痛、瘰疬、肘臂挛麻',
  '极泉': '心痛、心悸、胁肋疼痛、臂丛神经损伤',
  '百会': '头痛、眩晕、失眠、健忘、癫狂痫、脱肛',
  '大椎': '发热、盗汗、咳嗽、气喘、癫狂痫、项强',
  '命门': '遗精、阳痿、月经不调、痛经、腰痛、泄泻',
  '至阳': '胸胁胀痛、黄疸、咳嗽、气喘、脊强',
  '长强': '便血、痔疾、脱肛、泄泻、便秘、癫狂痫',
  '腰阳关': '月经不调、遗精、阳痿、腰骶疼痛、下肢痿痹',
  '风府': '头痛、眩晕、项强、鼻塞、咽喉肿痛',
  '印堂': '头痛、眩晕、鼻渊、鼻衄、失眠',
  '水沟': '昏迷、晕厥、癫狂痫、口歪、腰脊强痛',
  '太阳': '头痛、眩晕、目赤肿痛、齿痛、口眼歪斜',
  '十宣': '昏迷、晕厥、发热、咽喉肿痛',
  '四缝': '疳积、百日咳、腹泻、消化不良',
  '胆囊穴': '胁痛、黄疸、胆囊炎、胆石症',
  '阑尾穴': '腹痛、泄泻、阑尾炎',
  '八风': '足跗肿痛、趾麻、毒蛇咬伤',
  '八邪': '手背肿痛、烦热、毒蛇咬伤',
  '安眠': '失眠、头痛、眩晕、心悸、精神病',
};

// 穴位函数
function getMeridian(pointName) {
  return ACUPOINT_MERIDIAN_MAP[pointName] || '待确认';
}

function getEffect(pointName) {
  return ACUPOINT_EFFECT_MAP[pointName] || '调理气血';
}

function getLocation(pointName) {
  return ACUPOINT_LOCATION_MAP[pointName] || '标准定位待确认';
}

function getIndications(pointName) {
  return ACUPOINT_INDICATIONS_MAP[pointName] || '请咨询专业医师';
}

function getAcupointInfo(pointName) {
  return {
    name: pointName,
    meridian: getMeridian(pointName),
    location: getLocation(pointName),
    effect: getEffect(pointName),
    indications: getIndications(pointName),
  };
}

function getAllAcupointNames() {
  return Object.keys(ACUPOINT_MERIDIAN_MAP);
}

function getAcupointCount() {
  return Object.keys(ACUPOINT_MERIDIAN_MAP).length;
}

function searchAcupoints(keyword) {
  const results = [];
  const kw = keyword.toLowerCase();
  
  for (const name of Object.keys(ACUPOINT_MERIDIAN_MAP)) {
    const meridian = ACUPOINT_MERIDIAN_MAP[name] || '';
    const effect = ACUPOINT_EFFECT_MAP[name] || '';
    const indications = ACUPOINT_INDICATIONS_MAP[name] || '';
    
    if (name.includes(keyword) || 
        meridian.includes(keyword) || 
        effect.includes(keyword) || 
        indications.includes(keyword)) {
      results.push(getAcupointInfo(name));
    }
  }
  
  return results;
}

// ==================== 辨证规则 ====================

// 舌色辨证规则
const tongueColorRules = [
  { id: 'TC-001', name: '淡红舌辨证', conditions: { tongueColor: '淡红' }, result: { syndrome: '正常/健康态', pathogenesis: '气血调和，阴阳平衡', treatment: '保健调理', mainPoints: ['足三里', '关元'], secondaryPoints: ['气海', '三阴交'], organLocation: ['脾胃'], priority: 'normal', weight: 10 } },
  { id: 'TC-002', name: '淡白舌辨证', conditions: { tongueColor: '淡白' }, result: { syndrome: '气血两虚证/阳虚证', pathogenesis: '阳气不足，血失温煦', treatment: '补益气血、温阳散寒', mainPoints: ['足三里', '气海'], secondaryPoints: ['三阴交', '命门'], organLocation: ['脾', '肾'], priority: 'high', weight: 30 } },
  { id: 'TC-003', name: '红舌辨证', conditions: { tongueColor: '红' }, result: { syndrome: '热证', pathogenesis: '里热炽盛，熏蒸于舌', treatment: '清热泻火/滋阴降火', mainPoints: ['大椎', '曲池'], secondaryPoints: ['合谷', '太溪'], organLocation: ['胃', '心'], priority: 'high', weight: 35 } },
  { id: 'TC-004', name: '绛舌辨证', conditions: { tongueColor: '绛' }, result: { syndrome: '热入营血证', pathogenesis: '热入营血，阴虚火旺', treatment: '清营凉血、养阴清热', mainPoints: ['曲泽', '膈俞'], secondaryPoints: ['委中', '太溪'], organLocation: ['心', '肝'], priority: 'critical', weight: 45 } },
  { id: 'TC-005', name: '紫舌辨证', conditions: { tongueColor: '紫' }, result: { syndrome: '血瘀证', pathogenesis: '寒凝血瘀/热盛血瘀', treatment: '活血化瘀、温经散寒', mainPoints: ['血海', '膈俞'], secondaryPoints: ['三阴交', '关元'], organLocation: ['肝', '心'], priority: 'high', weight: 40 } },
  { id: 'TC-006', name: '青紫舌辨证', conditions: { tongueColor: '青紫' }, result: { syndrome: '寒凝血瘀证', pathogenesis: '阳虚寒盛，肝郁血瘀', treatment: '温经活血、疏肝解郁', mainPoints: ['关元', '肝俞'], secondaryPoints: ['太冲', '血海'], organLocation: ['肝', '肾'], priority: 'critical', weight: 50 } },
];

// 舌形辨证规则
const tongueShapeRules = [
  { id: 'TS-001', name: '胖大舌辨证', conditions: { tongueShape: '胖大' }, result: { syndrome: '水湿停滞证', pathogenesis: '脾虚湿盛/阳虚水泛', treatment: '健脾祛湿、利水渗湿', mainPoints: ['足三里', '阴陵泉'], secondaryPoints: ['脾俞', '水分'], organLocation: ['脾', '肾'], priority: 'high', weight: 32 } },
  { id: 'TS-002', name: '瘦薄舌辨证', conditions: { tongueShape: '瘦薄' }, result: { syndrome: '阴血不足证', pathogenesis: '气血两虚/阴虚火旺', treatment: '益气养血、滋阴降火', mainPoints: ['三阴交', '太溪'], secondaryPoints: ['足三里', '照海'], organLocation: ['肝', '肾'], priority: 'high', weight: 35 } },
  { id: 'TS-003', name: '裂纹舌辨证', conditions: { tongueShape: '正常', crack: true }, result: { syndrome: '阴血亏虚证', pathogenesis: '阴虚内热/血虚失养', treatment: '滋阴养血、润燥生津', mainPoints: ['三阴交', '血海'], secondaryPoints: ['太溪', '照海'], organLocation: ['肝', '肾', '脾'], priority: 'medium', weight: 30 } },
  { id: 'TS-004', name: '齿痕舌辨证', conditions: { tongueShape: '胖大', teethMark: true }, result: { syndrome: '脾虚湿盛证', pathogenesis: '脾虚不运/水湿内停', treatment: '健脾益气、化湿和中', mainPoints: ['足三里', '阴陵泉'], secondaryPoints: ['脾俞', '公孙'], organLocation: ['脾', '胃'], priority: 'high', weight: 34 } },
];

// 苔色辨证规则
const coatingColorRules = [
  { id: 'CC-001', name: '薄白苔辨证', conditions: { coatingColor: '薄白' }, result: { syndrome: '表证/轻证', pathogenesis: '风寒束表/胃气未伤', treatment: '解表散寒/扶正调理', mainPoints: ['列缺', '合谷'], secondaryPoints: ['风池', '足三里'], organLocation: ['肺', '胃'], priority: 'normal', weight: 15 } },
  { id: 'CC-002', name: '白厚苔辨证', conditions: { coatingColor: '白厚' }, result: { syndrome: '里寒/湿浊证', pathogenesis: '寒湿内停/痰湿壅盛', treatment: '温阳化湿/健脾燥湿', mainPoints: ['关元', '阴陵泉'], secondaryPoints: ['脾俞', '丰隆'], organLocation: ['脾', '肾'], priority: 'medium', weight: 28 } },
  { id: 'CC-003', name: '黄厚苔辨证', conditions: { coatingColor: '黄', coatingTexture: '厚' }, result: { syndrome: '里热炽盛证', pathogenesis: '胃肠实热/湿热蕴结', treatment: '清热泻火、通腑导滞', mainPoints: ['天枢', '内庭'], secondaryPoints: ['曲池', '上巨虚'], organLocation: ['胃', '大肠'], priority: 'high', weight: 38 } },
  { id: 'CC-004', name: '黄腻苔辨证', conditions: { coatingColor: '黄', coatingTexture: '厚' }, result: { syndrome: '湿热内蕴证', pathogenesis: '脾胃湿热/肝胆湿热', treatment: '清热化湿、健脾和胃', mainPoints: ['阴陵泉', '太冲'], secondaryPoints: ['中脘', '阳陵泉'], organLocation: ['脾', '肝', '胆'], priority: 'high', weight: 40 } },
  { id: 'CC-005', name: '灰黑干苔辨证', conditions: { coatingColor: '灰黑', coatingMoisture: '燥' }, result: { syndrome: '热极伤阴证', pathogenesis: '阴液枯竭/热毒炽盛', treatment: '清热解毒、养阴生津', mainPoints: ['太溪', '照海'], secondaryPoints: ['曲泽', '大椎放血'], organLocation: ['肾', '心'], priority: 'critical', weight: 55 } },
  { id: 'CC-006', name: '灰黑滑苔辨证', conditions: { coatingColor: '灰黑', coatingMoisture: '润' }, result: { syndrome: '阳虚寒盛证', pathogenesis: '脾肾阳虚/寒湿内盛', treatment: '温阳散寒、健脾化湿', mainPoints: ['关元', '命门'], secondaryPoints: ['神阙灸', '肾俞'], organLocation: ['脾', '肾'], priority: 'critical', weight: 50 } },
  { id: 'CC-007', name: '剥落苔辨证', conditions: { coatingColor: '剥落' }, result: { syndrome: '胃阴/胃气大伤证', pathogenesis: '阴虚/气阴两虚', treatment: '养阴益胃', mainPoints: ['三阴交', '太溪'], secondaryPoints: ['胃俞', '足三里'], organLocation: ['胃', '脾'], priority: 'high', weight: 40 } },
];

// 舌态辨证规则
const tongueStateRules = [
  { id: 'TST-001', name: '颤动舌辨证', conditions: { tongueState: '颤动' }, result: { syndrome: '肝风内动证', pathogenesis: '血虚动风/热极生风/阴虚动风', treatment: '平肝熄风、养血柔肝', mainPoints: ['太冲', '风池'], secondaryPoints: ['辨证配穴'], organLocation: ['肝'], priority: 'critical', weight: 48 } },
  { id: 'TST-002', name: '歪斜舌辨证', conditions: { tongueState: '歪斜' }, result: { syndrome: '风中经络证', pathogenesis: '肝风夹痰/气虚血瘀', treatment: '祛风化痰、活血通络', mainPoints: ['颊车', '地仓', '合谷'], secondaryPoints: ['太冲', '丰隆'], organLocation: ['肝', '胃'], priority: 'critical', weight: 50 } },
  { id: 'TST-003', name: '萎软舌辨证', conditions: { tongueState: '痿软' }, result: { syndrome: '气血亏极证', pathogenesis: '气血两虚/阴虚火旺/热盛伤津', treatment: '补益气血、滋阴润燥', mainPoints: ['足三里', '三阴交'], secondaryPoints: ['太溪', '百会'], organLocation: ['脾', '肾'], priority: 'critical', weight: 45 } },
  { id: 'TST-004', name: '强硬舌辨证', conditions: { tongueState: '强硬' }, result: { syndrome: '热闭/风痰证', pathogenesis: '热入心包/风痰阻络', treatment: '醒脑开窍、清热化痰', mainPoints: ['水沟', '内关'], secondaryPoints: ['丰隆', '百会'], organLocation: ['心', '脑'], priority: 'critical', weight: 55 } },
];

// 舌质+舌苔复合辨证
const tongueBodyCoatingRules = [
  { id: 'TBC-001', name: '淡白舌+白苔', conditions: { tongueColor: '淡白', coatingColor: '薄白' }, result: { syndrome: '气血两虚证', pathogenesis: '阳气不足，血失温煦', treatment: '益气养血、温阳散寒', mainPoints: ['足三里', '三阴交'], secondaryPoints: ['气海', '关元'], organLocation: ['脾', '胃'], priority: 'high', weight: 42 } },
  { id: 'TBC-002', name: '淡白舌+白腻苔', conditions: { tongueColor: '淡白', coatingColor: '白厚', coatingTexture: '厚' }, result: { syndrome: '脾虚湿盛证', pathogenesis: '脾失健运，湿浊内停', treatment: '健脾祛湿、利水渗湿', mainPoints: ['足三里', '阴陵泉'], secondaryPoints: ['脾俞', '中脘'], organLocation: ['脾', '胃'], priority: 'high', weight: 45 } },
  { id: 'TBC-003', name: '淡白舌+胖大', conditions: { tongueColor: '淡白', tongueShape: '胖大' }, result: { syndrome: '脾肾阳虚证', pathogenesis: '阳气衰微，水湿内停', treatment: '温补脾肾、利水消肿', mainPoints: ['关元', '命门'], secondaryPoints: ['肾俞', '足三里'], organLocation: ['脾', '肾'], priority: 'high', weight: 48 } },
  { id: 'TBC-004', name: '淡白舌+齿痕', conditions: { tongueColor: '淡白', teethMark: true }, result: { syndrome: '脾虚气弱证', pathogenesis: '脾气亏虚，运化失司', treatment: '健脾益气、和中调胃', mainPoints: ['足三里', '脾俞'], secondaryPoints: ['公孙', '中脘'], organLocation: ['脾', '胃'], priority: 'high', weight: 46 } },
  { id: 'TBC-005', name: '淡白舌+瘦薄', conditions: { tongueColor: '淡白', tongueShape: '瘦薄' }, result: { syndrome: '气血两虚证', pathogenesis: '气血不足，失于濡养', treatment: '补益气血、健脾养胃', mainPoints: ['三阴交', '足三里'], secondaryPoints: ['气海', '血海'], organLocation: ['脾', '胃', '肝'], priority: 'high', weight: 48 } },
  { id: 'TBC-006', name: '红舌+黄苔', conditions: { tongueColor: '红', coatingColor: '黄' }, result: { syndrome: '实热证', pathogenesis: '里热炽盛，熏灼舌体', treatment: '清热泻火、凉血解毒', mainPoints: ['大椎', '曲池'], secondaryPoints: ['合谷', '内庭'], organLocation: ['胃', '大肠'], priority: 'high', weight: 45 } },
  { id: 'TBC-007', name: '红舌+黄腻苔', conditions: { tongueColor: '红', coatingColor: '黄', coatingTexture: '厚' }, result: { syndrome: '湿热蕴结证', pathogenesis: '湿热中阻，脾胃运化失常', treatment: '清热化湿、健脾和胃', mainPoints: ['中脘', '阴陵泉'], secondaryPoints: ['天枢', '阳陵泉'], organLocation: ['脾', '胃', '肝'], priority: 'high', weight: 50 } },
  { id: 'TBC-008', name: '红绛舌+无苔', conditions: { tongueColor: '绛', coatingColor: '剥落' }, result: { syndrome: '阴虚火旺证', pathogenesis: '阴液亏耗，虚火上炎', treatment: '滋阴降火、养阴清热', mainPoints: ['太溪', '照海'], secondaryPoints: ['三阴交', '复溜'], organLocation: ['肾', '心'], priority: 'critical', weight: 55 } },
  { id: 'TBC-009', name: '红绛舌+黄燥苔', conditions: { tongueColor: '绛', coatingColor: '灰黑', coatingMoisture: '燥' }, result: { syndrome: '热盛伤津证', pathogenesis: '热入营血，津液大伤', treatment: '清营凉血、生津润燥', mainPoints: ['曲泽', '膈俞'], secondaryPoints: ['太溪', '照海'], organLocation: ['心', '肝', '肾'], priority: 'critical', weight: 58 } },
  { id: 'TBC-010', name: '绛舌+焦黑苔', conditions: { tongueColor: '绛', coatingColor: '灰黑' }, result: { syndrome: '热毒炽盛证', pathogenesis: '热极阴竭，毒火内盛', treatment: '清热解毒、凉血救阴', mainPoints: ['大椎', '曲泽放血'], secondaryPoints: ['十宣放血'], organLocation: ['心', '肝'], priority: 'critical', weight: 60 } },
  { id: 'TBC-011', name: '紫舌+白苔', conditions: { tongueColor: '紫', coatingColor: '薄白' }, result: { syndrome: '寒凝血瘀证', pathogenesis: '寒凝经脉，血行不畅', treatment: '温经活血、散寒化瘀', mainPoints: ['关元', '血海'], secondaryPoints: ['膈俞', '三阴交'], organLocation: ['肝', '心'], priority: 'high', weight: 48 } },
  { id: 'TBC-012', name: '紫舌+黄苔', conditions: { tongueColor: '紫', coatingColor: '黄' }, result: { syndrome: '热结血瘀证', pathogenesis: '热结肠道，瘀热互结', treatment: '清热化瘀、通腑散结', mainPoints: ['天枢', '上巨虚'], secondaryPoints: ['曲池', '膈俞'], organLocation: ['大肠', '肝'], priority: 'high', weight: 50 } },
  { id: 'TBC-013', name: '紫舌+瘀斑', conditions: { tongueColor: '紫', tongueShape: '正常', crack: true }, result: { syndrome: '气滞血瘀证', pathogenesis: '气机郁滞，瘀血内停', treatment: '行气活血、化瘀通络', mainPoints: ['太冲', '血海'], secondaryPoints: ['膈俞', '三阴交'], organLocation: ['肝', '心'], priority: 'high', weight: 48 } },
  { id: 'TBC-014', name: '青舌+白苔', conditions: { tongueColor: '青紫', coatingColor: '薄白' }, result: { syndrome: '阳虚寒凝证', pathogenesis: '阳气衰微，寒凝血瘀', treatment: '温阳散寒、活血化瘀', mainPoints: ['关元', '命门'], secondaryPoints: ['神阙灸', '血海'], organLocation: ['肾', '肝'], priority: 'critical', weight: 52 } },
];

// 三维综合辨证
const threeDimensionalRules = [
  { id: '3D-001', name: '淡白胖大+白腻苔综合辨证', conditions: { tongueColor: '淡白', tongueShape: '胖大', coatingColor: '白厚', coatingTexture: '厚' }, result: { syndrome: '脾虚湿盛证', pathogenesis: '脾失健运，湿浊内停，气化失司', treatment: '健脾祛湿、利水渗湿', mainPoints: ['足三里', '阴陵泉', '脾俞'], secondaryPoints: ['中脘', '水分'], organLocation: ['脾', '胃'], priority: 'high', weight: 70 } },
  { id: '3D-002', name: '淡白瘦薄+薄白苔+萎软综合辨证', conditions: { tongueColor: '淡白', tongueShape: '瘦薄', coatingColor: '薄白', tongueState: '痿软' }, result: { syndrome: '气血两虚证', pathogenesis: '气血不足，筋脉失养，脏腑亏虚', treatment: '补益气血、健脾养胃', mainPoints: ['足三里', '三阴交', '气海'], secondaryPoints: ['血海', '百会'], organLocation: ['脾', '胃', '肝'], priority: 'critical', weight: 75 } },
  { id: '3D-003', name: '红绛少津+黄燥+颤动综合辨证', conditions: { tongueColor: '绛', tongueState: '颤动', coatingColor: '灰黑', coatingMoisture: '燥' }, result: { syndrome: '热盛动风证', pathogenesis: '热入营血，津液大伤，肝风内动', treatment: '清热熄风、凉血生津', mainPoints: ['大椎', '曲池', '太冲', '风池'], secondaryPoints: ['曲泽', '照海'], organLocation: ['肝', '心', '肾'], priority: 'critical', weight: 85 } },
  { id: '3D-004', name: '红绛裂纹+剥落+萎软综合辨证', conditions: { tongueColor: '绛', tongueState: '痿软', coatingColor: '剥落', tongueShape: '正常' }, result: { syndrome: '阴虚火旺证', pathogenesis: '阴液亏耗，虚火灼津，筋脉失养', treatment: '滋阴降火、养阴生津', mainPoints: ['太溪', '照海', '三阴交'], secondaryPoints: ['复溜', '涌泉'], organLocation: ['肾', '心', '肝'], priority: 'critical', weight: 80 } },
  { id: '3D-005', name: '紫暗瘀斑+厚腻综合辨证', conditions: { tongueColor: '紫', coatingColor: '白厚', coatingTexture: '厚', tongueShape: '正常' }, result: { syndrome: '痰瘀互结证', pathogenesis: '气滞血瘀，痰凝互结，阻滞经络', treatment: '活血化瘀、化痰散结', mainPoints: ['血海', '膈俞', '丰隆', '阴陵泉'], secondaryPoints: ['三阴交', '中脘'], organLocation: ['肝', '脾', '胃'], priority: 'critical', weight: 75 } },
  { id: '3D-006', name: '紫暗水滑+灰黑苔综合辨证', conditions: { tongueColor: '紫', coatingColor: '灰黑', coatingMoisture: '润' }, result: { syndrome: '阳虚寒凝证', pathogenesis: '脾肾阳虚，寒湿内盛，气血凝滞', treatment: '温阳散寒、健脾化湿', mainPoints: ['关元', '命门', '神阙灸'], secondaryPoints: ['肾俞', '脾俞'], organLocation: ['肾', '脾'], priority: 'critical', weight: 80 } },
  { id: '3D-007', name: '红边黄腻+黄厚腻+歪斜综合辨证', conditions: { tongueColor: '红', coatingColor: '黄', coatingTexture: '厚', tongueState: '歪斜' }, result: { syndrome: '肝胆湿热+风痰证', pathogenesis: '湿热蕴结肝胆，热盛生风，痰湿互结', treatment: '清肝利胆、化痰熄风', mainPoints: ['太冲', '阳陵泉', '丰隆', '中脘'], secondaryPoints: ['行间', '胆俞'], organLocation: ['肝', '胆', '胃'], priority: 'critical', weight: 85 } },
];

// 所有规则分类
const allRuleCategories = {
  threeDimensional: threeDimensionalRules,
  tongueBodyCoating: tongueBodyCoatingRules,
  tongueState: tongueStateRules,
  tongueColor: tongueColorRules,
  tongueShape: tongueShapeRules,
  coatingColor: coatingColorRules,
};

// 规则统计函数
function getRuleCount() {
  return Object.values(allRuleCategories).reduce((sum, rules) => sum + rules.length, 0);
}

function getAllSyndromes() {
  const syndromes = new Set();
  for (const rules of Object.values(allRuleCategories)) {
    for (const rule of rules) {
      syndromes.add(rule.result.syndrome);
    }
  }
  return Array.from(syndromes);
}

function getRulesSummary() {
  return {
    tongueColor: tongueColorRules.length,
    tongueShape: tongueShapeRules.length,
    coatingColor: coatingColorRules.length,
    tongueState: tongueStateRules.length,
    tongueBodyCoating: tongueBodyCoatingRules.length,
    threeDimensional: threeDimensionalRules.length,
    total: getRuleCount()
  };
}

// 条件匹配
function matchCondition(conditions, features) {
  if (!conditions) return true;
  
  if (conditions.tongueColor && features.tongue_color !== conditions.tongueColor) {
    if (conditions.tongueColor !== '淡白' || !features.tongue_color?.includes('淡白')) {
      return false;
    }
  }
  
  if (conditions.tongueShape && features.tongue_shape !== conditions.tongueShape) {
    if (conditions.tongueShape !== '正常' || features.tongue_shape === '正常') {
      return false;
    }
  }
  
  if (conditions.coatingColor && features.tongue_coating_color !== conditions.coatingColor) {
    if (conditions.coatingColor === '薄白' && features.tongue_coating_color?.startsWith('白')) {
      // 允许
    } else if (conditions.coatingColor !== '剥落' || features.tongue_coating_color !== '剥落') {
      return false;
    }
  }
  
  if (conditions.coatingTexture && features.tongue_coating_texture !== conditions.coatingTexture) {
    if (conditions.coatingTexture !== '正常') return false;
  }
  
  if (conditions.coatingMoisture && features.tongue_coating_moisture !== conditions.coatingMoisture) {
    if (conditions.coatingMoisture !== '正常') return false;
  }
  
  if (conditions.tongueState && features.tongue_state !== conditions.tongueState) {
    return false;
  }
  
  if (conditions.teethMark !== undefined) {
    if (conditions.teethMark && !features.teeth_mark) return false;
    if (!conditions.teethMark && features.teeth_mark) return false;
  }
  
  if (conditions.crack !== undefined) {
    if (conditions.crack && !features.crack) return false;
    if (!conditions.crack && features.crack) return false;
  }
  
  return true;
}

// 舌诊辨证主函数
function diagnoseTongue(features) {
  const matchedRules = [];
  
  for (const rules of Object.values(allRuleCategories)) {
    for (const rule of rules) {
      if (matchCondition(rule.conditions, features)) {
        matchedRules.push(rule);
      }
    }
  }
  
  matchedRules.sort((a, b) => b.result.weight - a.result.weight);
  
  if (matchedRules.length === 0) {
    return {
      syndrome: '待进一步诊断',
      pathogenesis: '特征不典型',
      treatment: '建议详细辨证',
      mainPoints: ['足三里', '关元'],
      secondaryPoints: ['三阴交'],
      organLocation: ['脾胃'],
      confidence: 0,
      matchedRuleId: null,
      matchedRuleName: null,
      priority: 'normal',
      isLocalRule: true,
    };
  }
  
  const bestRule = matchedRules[0];
  const confidence = Math.min(bestRule.result.weight / 100, 0.95);
  
  return {
    syndrome: bestRule.result.syndrome,
    pathogenesis: bestRule.result.pathogenesis,
    treatment: bestRule.result.treatment,
    mainPoints: bestRule.result.mainPoints,
    secondaryPoints: bestRule.result.secondaryPoints,
    organLocation: bestRule.result.organLocation,
    confidence: confidence,
    matchedRuleId: bestRule.id,
    matchedRuleName: bestRule.name,
    priority: bestRule.result.priority,
    isLocalRule: true,
    allMatches: matchedRules.slice(0, 5).map(r => ({
      id: r.id,
      name: r.name,
      syndrome: r.result.syndrome,
      weight: r.result.weight,
    })),
  };
}

// ==================== Coze API配置 ====================
const COZE_CONFIG = {
  botId: '7634049322782785572',
  chatApiUrl: 'https://api.coze.cn/v3/chat',
  uploadApiUrl: 'https://api.coze.cn/v1/files/upload',
  token: 'pat_cT0kGwXPwioWz69z65sLufTqcr1PJNorzO4EJbymAfbMM7uWC2W2qDCvdEqiK1l6'
};

// ==================== 工具定义 ====================
const TOOLS = [
  {
    name: "tongue_analyze",
    description: "舌诊辨证分析 - 传入舌象特征（舌色、舌形、舌苔等），返回中医辨证结果、证型判断、脏腑定位和针灸选穴建议",
    inputSchema: {
      type: "object",
      required: ["tongue_color", "tongue_shape"],
      properties: {
        tongue_color: { type: "string", description: "舌色", enum: ["淡红", "淡白", "红", "绛", "紫", "青紫"] },
        tongue_shape: { type: "string", description: "舌形", enum: ["胖大", "瘦薄", "正常"] },
        tongue_state: { type: "string", description: "舌态", enum: ["强硬", "痿软", "歪斜", "颤动", "正常"], default: "正常" },
        coating_color: { type: "string", description: "苔色", enum: ["薄白", "白厚", "黄", "灰黑", "剥落"], default: "薄白" },
        coating_texture: { type: "string", description: "苔质", enum: ["薄", "厚", "正常"], default: "薄" },
        coating_moisture: { type: "string", description: "润燥", enum: ["润", "燥", "正常"], default: "润" },
        teeth_mark: { type: "boolean", description: "是否有齿痕", default: false },
        crack: { type: "boolean", description: "是否有裂纹", default: false },
        chief_complaint: { type: "string", description: "主诉症状（可选）" },
        patient_age: { type: "number", description: "患者年龄（可选）" },
        patient_gender: { type: "string", description: "患者性别", enum: ["男", "女"] }
      }
    }
  },
  {
    name: "tongue_image_analyze",
    description: "上传舌象图片进行AI识别与辨证 - 传入base64编码的舌象图片，自动识别舌象特征并返回完整辨证结果",
    inputSchema: {
      type: "object",
      required: ["image"],
      properties: {
        image: { type: "string", description: "base64编码的舌象图片（data URL格式或纯base64）" },
        patient_age: { type: "number", description: "患者年龄（可选）" },
        patient_gender: { type: "string", description: "患者性别（可选）", enum: ["男", "女"] }
      }
    }
  },
  {
    name: "query_acupoint",
    description: "查询穴位信息 - 传入穴位名称，返回定位、经脉归属、功效、主治等完整信息",
    inputSchema: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", description: "穴位名称，如'足三里'、'太溪'、'合谷'等" }
      }
    }
  },
  {
    name: "list_acupoints",
    description: "列出所有支持的穴位 - 返回穴位列表及完整信息",
    inputSchema: { type: "object", properties: {} }
  }
];

// ==================== 处理函数 ====================

async function handleTongueAnalyze(args) {
  try {
    const result = diagnoseTongue({
      tongue_color: args.tongue_color,
      tongue_shape: args.tongue_shape,
      tongue_state: args.tongue_state || '正常',
      tongue_coating_color: args.coating_color || '薄白',
      tongue_coating_texture: args.coating_texture || '薄',
      tongue_coating_moisture: args.coating_moisture || '润',
      teeth_mark: args.teeth_mark || false,
      crack: args.crack || false,
    });
    if (args.chief_complaint) result.chiefComplaint = args.chief_complaint;
    if (args.patient_age) result.patientAge = args.patient_age;
    if (args.patient_gender) result.patientGender = args.patient_gender;
    return result;
  } catch (error) {
    return { error: `辨证分析失败: ${error.message}` };
  }
}

async function handleImageAnalyze(args) {
  try {
    const { image, patient_age, patient_gender } = args;
    if (!image) return { error: '缺少图片数据' };

    let mimeType = 'image/jpeg';
    let pureBase64 = image;
    if (image.startsWith('data:')) {
      const commaIdx = image.indexOf(',');
      if (commaIdx > 0) {
        const meta = image.slice(0, commaIdx);
        const mimeMatch = meta.match(/:(image\/[a-zA-Z0-9.+-]+)/);
        if (mimeMatch) mimeType = mimeMatch[1];
        pureBase64 = image.slice(commaIdx + 1);
      }
    }
    pureBase64 = pureBase64.replace(/\s/g, '');
    const buffer = Buffer.from(pureBase64, 'base64');
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const fileName = `tongue_${Date.now()}.${ext}`;

    const boundary = '----CozeUpload' + Date.now().toString(36);
    const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([header, buffer, footer]);

    const uploadRes = await fetch(COZE_CONFIG.uploadApiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: payload
    });

    const uploadData = await uploadRes.json();
    if (uploadData.code !== 0 || !uploadData.data?.id) return { error: `图片上传失败: ${uploadData.msg || 'unknown'}` };

    const fileId = uploadData.data.id;

    const TONGUE_PROMPT = `你是一个舌象判断与识别系统。请严格执行以下判断：【判断】图片中是否包含伸出的舌头和口腔？判断标准：必须能清晰看到口腔内伸出的舌头。如果没有舌头和口腔，返回：{"tongueDetected":false,"message":"未检测到舌象"}。如果有舌头和口腔，返回：{"tongueDetected":true,"tongue_color":"","tongue_shape":"","teeth_mark":{"has":false},"crack":{"has":false},"tongue_coating":{"color":"","texture":""}}`;

    const chatRes = await fetch(COZE_CONFIG.chatApiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bot_id: COZE_CONFIG.botId,
        user_id: `mcp_${Date.now()}`,
        stream: false,
        additional_messages: [{ role: 'user', content_type: 'object_string', content: JSON.stringify([{ type: 'file', file_id: fileId }, { type: 'text', text: TONGUE_PROMPT }]) }]
      })
    });

    const chatData = await chatRes.json();
    if (chatData.code !== 0 || !chatData.data?.id) return { error: `创建对话失败: ${chatData.msg || 'unknown'}` };

    const chatId = chatData.data.id;

    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusRes = await fetch(`https://api.coze.cn/v3/chat/retrieve?chat_id=${chatId}&conversation_id=${chatData.data.conversation_id}`, {
        headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': 'application/json' }
      });

      const statusData = await statusRes.json();

      if (statusData.data?.status === 'completed') {
        const messagesRes = await fetch(`https://api.coze.cn/v3/chat/message/list?chat_id=${chatId}&conversation_id=${chatData.data.conversation_id}`, {
          headers: { 'Authorization': `Bearer ${COZE_CONFIG.token}`, 'Content-Type': 'application/json' }
        });

        const messagesData = await messagesRes.json();
        let tongueFeatures = null;

        for (const msg of (messagesData.data || [])) {
          if (msg.role === 'assistant' && msg.type === 'answer') {
            try {
              const jsonMatch = msg.content.match(/\{[\s\S]*\}/);
              if (jsonMatch) tongueFeatures = JSON.parse(jsonMatch[0]);
            } catch (e) {}
          }
        }

        if (tongueFeatures && tongueFeatures.tongueDetected) {
          const diagnosisResult = diagnoseTongue({
            tongue_color: tongueFeatures.tongue_color || tongueFeatures.tongueColor,
            tongue_shape: tongueFeatures.tongue_shape || tongueFeatures.tongueShape,
            tongue_state: '正常',
            tongue_coating_color: tongueFeatures.tongue_coating?.color || '薄白',
            tongue_coating_texture: tongueFeatures.tongue_coating?.texture || '薄',
            tongue_coating_moisture: '润',
            teeth_mark: tongueFeatures.teeth_mark?.has || false,
            crack: tongueFeatures.crack?.has || false,
          });
          if (patient_age) diagnosisResult.patientAge = patient_age;
          if (patient_gender) diagnosisResult.patientGender = patient_gender;
          diagnosisResult.imageAnalysis = tongueFeatures;
          return diagnosisResult;
        }

        return { error: tongueFeatures?.message || '未能识别舌象特征' };
      }

      if (statusData.data?.status === 'failed') return { error: 'AI识别失败' };
    }

    return { error: '识别超时，请重试' };

  } catch (error) {
    return { error: `图片分析失败: ${error.message}` };
  }
}

async function handleAcupointQuery(args) {
  const { name } = args;
  if (!name) return { error: '缺少穴位名称' };
  
  const info = getAcupointInfo(name);
  if (!info || !info.meridian || info.meridian === '待确认') {
    const suggestions = searchAcupoints(name);
    if (suggestions.length > 0) {
      return { 
        error: `未找到精确匹配的穴位 "${name}"`,
        suggestions: suggestions.map(s => s.name),
        similarPoints: suggestions
      };
    }
    return { 
      error: `未找到穴位 "${name}"`,
      allPoints: getAllAcupointNames().slice(0, 20)
    };
  }
  return info;
}

async function handleListAcupoints() {
  const allNames = getAllAcupointNames();
  const acupoints = allNames.map(name => getAcupointInfo(name));
  
  return {
    total: getAcupointCount(),
    ruleCount: getRuleCount(),
    acupoints
  };
}

// ==================== MCP主处理器 ====================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({});

  if (req.method === 'GET') {
    return res.json({
      name: "舌镜辨证能力引擎",
      version: "2.0.0",
      protocol: "MCP",
      endpoint: "https://she-zhen.top/api/mcp",
      description: "基于中医舌诊理论的辨证分析MCP服务 - 全内联版本",
      capabilities: {
        tools: {
          tongue_analyze: "舌诊辨证分析（基于特征输入）",
          tongue_image_analyze: "舌象图片AI识别与辨证",
          query_acupoint: "穴位信息查询（完整字段：name/meridian/location/effect/indications）",
          list_acupoints: "穴位列表"
        }
      },
      dataSync: {
        acupointCount: getAcupointCount(),
        diagnosisRuleCount: getRuleCount(),
        syndromes: getAllSyndromes(),
        status: "内联完成"
      },
      supportedFeatures: getRulesSummary()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ jsonrpc: "2.0", error: { code: -32600, message: "Method not allowed" } });
  }

  try {
    const body = req.body || {};
    const { jsonrpc, method, params, id } = body;

    if (jsonrpc !== "2.0") {
      return res.json({ jsonrpc: "2.0", error: { code: -32600, message: "Invalid JSON-RPC version" }, id });
    }

    if (method === 'initialize') {
      return res.json({
        jsonrpc: "2.0",
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {}, resources: { subscribe: false, listChanged: false } },
          serverInfo: { name: "舌镜辨证能力引擎", version: "2.0.0" }
        },
        id
      });
    }

    if (method === 'tools/list') {
      return res.json({ jsonrpc: "2.0", result: { tools: TOOLS }, id });
    }

    if (method === 'tools/call') {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      let result;
      if (toolName === 'tongue_analyze') result = await handleTongueAnalyze(toolArgs);
      else if (toolName === 'tongue_image_analyze') result = await handleImageAnalyze(toolArgs);
      else if (toolName === 'query_acupoint') result = await handleAcupointQuery(toolArgs);
      else if (toolName === 'list_acupoints') result = await handleListAcupoints();
      else return res.json({ jsonrpc: "2.0", error: { code: -32601, message: `未知工具: ${toolName}` }, id });

      const content = typeof result === 'string' ? [{ type: "text", text: result }] : [{ type: "text", text: JSON.stringify(result, null, 2) }];
      return res.json({ jsonrpc: "2.0", result: { content, isError: result.error ? true : false }, id });
    }

    return res.json({ jsonrpc: "2.0", error: { code: -32601, message: `未知方法: ${method}` }, id });

  } catch (error) {
    console.error('MCP Error:', error);
    return res.json({ jsonrpc: "2.0", error: { code: -32603, message: `Internal error: ${error.message}` }, id: req.body?.id });
  }
}
