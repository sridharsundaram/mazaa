{
    spawn_timer -= 1;
    if (spawn_timer >= 0)
    {
        image_alpha = ((PLAYER_SPAWN_INVUL_TIME - spawn_timer) / PLAYER_SPAWN_INVUL_TIME);
    }
    else
    {
        spawn_invul = 0;
    }

    if (health <= 0)
    {
        lives -= 1;
        if (lives == 0)
        {
            game_restart();
        }
        else
        {
            health = 100;        
            sound_play(snd_playerExplosion);
            instance_create(x, y, obj_player_explosion);
            instance_destroy();
        }
    }
}
