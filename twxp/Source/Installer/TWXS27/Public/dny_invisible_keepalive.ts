# ----------------------------------------------------
# Dnyarri's (semi) invisible keepalive 2.0
# Modeled after EP's which is modeled after Rev's
# use of char 27 for keepalive. 
#
# Pretty quiet, doesn't flood your screen with a lot
# of repetitive text. It prints timestamp and stats
# to the screen every 10 minutes to update your status
# window and provide a timestamp for your scrollback.
#
# Added blind warp and CBY protection for my corpies.
#
# More scripts and info at http://www.navhaz.com
# ----------------------------------------------------

systemScript

:print_time
   getTime $current_time
   echo ANSI_15 & "*" & $current_time & "*"
   send "/"

   # Uncomment this next line to echo a Who's Online too.
   # send "#"

   :set_the_triggers
   killtrigger print_time
   killtrigger no_cby
   killtrigger no_blind
   killtrigger no_blndt
   setDelayTrigger print_time :print_time 600000
   settexttrigger no_cby   :just_say_no "ARE YOU SURE CAPTAIN? (Y/N)"
   settexttrigger no_blind :just_say_no "Do you want to make this jump blind?"
   settexttrigger no_blndt :just_say_no "Do you want to make this transport blind?"

:keep_alive
   send #27
   killtrigger keep_alive
   setDelayTrigger keep_alive :keep_alive 30000
   pause

:just_say_no
   getWord CURRENTLINE $first_word  1
   getWord CURRENTLINE $second_word 2
   if ($first_word = "F") OR ($first_word = "P") OR ($first_word = "R")
      goto :set_the_triggers
   end
   if ($first_word = "Do") OR ($second_word = "ARE")
      send "*"
   end
   goto :set_the_triggers
