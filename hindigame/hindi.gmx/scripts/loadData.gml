var num;
global.dataLoaded = true;
num = instance_number(obj_choice);
for (i = 0; i < num; i += 1) {
  with (instance_find(obj_choice, i)) {
    picUrl = string(getChoice(num));
    if (picUrl != "?") {
      self.sprite = sprite_add(makeAbsoluteUrl(picUrl), 1, 0, 0, 0, 0);
    }
  }
}
var question;
question = instance_find(obj_question, 0);
question.sndUrl = getQuestion();

sleep(3000);
if (string(question.sndUrl) != "?") {
  playAudio(string(question.sndUrl));
}


