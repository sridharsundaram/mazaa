var num;
global.dataLoaded = true;
num = instance_number(obj_choice);
for (i = 0; i < num; i += 1) {
  with (instance_find(obj_choice, i)) {
    picUrl = string(getChoice(idNum));
    self.sprite = sprite_add(makeAbsoluteUrl(picUrl), 1, 0, 0, 0, 0);
  }
}
sleep(1000);



