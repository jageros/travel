const categories = {
  nationalParks: ['National parks','Parques nacionales','Parcs nationaux','Nationalparks','Parques nacionais','国家公园','國家公園','国立公園','국립공원','Parchi nazionali','المتنزهات الوطنية','राष्ट्रीय उद्यान'],
  landmarks: ['Landmarks','Monumentos','Monuments','Wahrzeichen','Pontos de referência','地标','地標','名所','랜드마크','Luoghi simbolo','المعالم','स्थलचिह्न'],
  historyCulture: ['History and culture','Historia y cultura','Histoire et culture','Geschichte und Kultur','História e cultura','历史与文化','歷史與文化','歴史と文化','역사와 문화','Storia e cultura','التاريخ والثقافة','इतिहास और संस्कृति'],
  scienceSpace: ['Science and space','Ciencia y espacio','Sciences et espace','Wissenschaft und Raumfahrt','Ciência e espaço','科学与太空','科學與太空','科学と宇宙','과학과 우주','Scienza e spazio','العلوم والفضاء','विज्ञान और अंतरिक्ष'],
  urbanParks: ['Urban parks','Parques urbanos','Parcs urbains','Stadtparks','Parques urbanos','城市公园','城市公園','都市公園','도시 공원','Parchi urbani','الحدائق الحضرية','शहरी उद्यान'],
};
const values = [
  ['en-US','On this page','Checked','Recheck by','Source-checked facts','This detail needs a fresh check before you rely on it. Consult the official provider for its current rules.','Photo of this place','Image credits and edits'],
  ['es','En esta página','Comprobado','Volver a comprobar antes de','Datos comprobados en la fuente','Este dato necesita una comprobación reciente. Consulta al proveedor oficial para conocer sus normas actuales.','Foto de este lugar','Créditos y ediciones de la imagen'],
  ['fr','Sur cette page','Vérifié','À vérifier avant le','Faits vérifiés par la source','Ce détail doit être vérifié à nouveau. Consultez le fournisseur officiel pour connaître les règles actuelles.','Photo de ce lieu','Crédits et modifications de l’image'],
  ['de','Auf dieser Seite','Geprüft','Erneut prüfen bis','Quellengeprüfte Angaben','Diese Angabe muss aktuell geprüft werden. Sieh beim offiziellen Anbieter nach den geltenden Regeln nach.','Foto dieses Ortes','Bildnachweis und Bearbeitungen'],
  ['pt-BR','Nesta página','Conferido','Confira novamente até','Fatos conferidos na fonte','Este detalhe precisa de uma nova conferência. Consulte o fornecedor oficial para ver as regras atuais.','Foto deste lugar','Créditos e edições da imagem'],
  ['zh-Hans','本页内容','核对日期','请在此日期前再次核对','来源核实的信息','这项信息需要重新核对。请查看官方提供方的最新规则。','此地照片','图片署名与编辑'],
  ['zh-Hant','本頁內容','核對日期','請在此日期前再次核對','來源核實的資訊','這項資訊需要重新核對。請查看官方提供方的最新規則。','此地照片','圖片署名與編輯'],
  ['ja','このページ','確認日','次の日付までに再確認','出典で確認した情報','この情報は再確認が必要です。現在のルールは公式提供者に確認してください。','この場所の写真','写真クレジットと編集'],
  ['ko','이 페이지의 내용','확인일','다음 날짜까지 다시 확인','출처 확인 정보','이 내용은 다시 확인해야 합니다. 현재 규정은 공식 제공처에서 확인하세요.','이 장소의 사진','사진 출처와 편집'],
  ['it','In questa pagina','Verificato','Ricontrollare entro','Informazioni verificate dalla fonte','Questo dettaglio richiede una nuova verifica. Consulta il fornitore ufficiale per le regole attuali.','Foto di questo luogo','Crediti e modifiche dell’immagine'],
  ['ar','في هذه الصفحة','تاريخ التحقق','أعد التحقق قبل','حقائق موثقة من المصدر','تحتاج هذه المعلومة إلى تحقق جديد. راجع الجهة الرسمية لمعرفة القواعد الحالية.','صورة لهذا المكان','حقوق الصورة وتعديلاتها'],
  ['hi','इस पृष्ठ पर','जाँच की तारीख','इस तारीख तक फिर जाँचें','स्रोत से जाँची गई जानकारी','इस विवरण की फिर से जाँच आवश्यक है। वर्तमान नियमों के लिए आधिकारिक प्रदाता देखें।','इस स्थान का फ़ोटो','फ़ोटो क्रेडिट और संपादन'],
];
const fields = ['onPage','checked','recheckBy','sourceCheckedFacts','freshFact','photoDescription','imageCredits'];
const copy = Object.fromEntries(values.map(([code, ...items]) => [code, Object.fromEntries(fields.map((field, index) => [field, items[index]]))]));
const categoryKeys = ['national-parks','landmarks','history-culture','science-space','urban-parks'];
for (const [index, code] of values.map(item => item[0]).entries()) {
  copy[code].categories = Object.fromEntries(categoryKeys.map((key, categoryIndex) => [key, categories[Object.keys(categories)[categoryIndex]][index]]));
}
export function articleCopy(code) { return copy[code] ?? copy['en-US']; }
