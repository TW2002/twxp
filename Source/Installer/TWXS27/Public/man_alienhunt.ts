############################################################
#  Script to parse sector space and see if it is alien space
#  Written 11/29/05 by Maniac
#  Successfully used in subzero games
#  12/10/05 added a killtrigger 1 to prevent an error
#  11/23/06 added a killtrigger
#  12/16/06 added a sound to ss channel report
#  02/18/07 Initial public release
#############################################################

#############################################################
#  This script will find alien space whether from probes or
#  holo scans it will write to a file as well as letting your
#  corpies know with the wonders of subspace.
#############################################################

systemscript
fileexists $sound "ding.wav"
setvar $version "1.0.3"

gosub :Brag
setvar $filename GAMENAME &".aliens"
send "#"
          setVar $alien_loop 0
          waitFor "Who's Playing"
:alien_loop
          killTrigger 1
          killTrigger 2
          add $alien_loop 1
          setTextLineTrigger 1 :grab_aliens "are on the move!"
          setTextTrigger 2 :initiate "Command"
          pause

:grab_aliens
          setVar $dont_drop CURRENTLINE
          getWord $dont_drop $game_alien[$alien_loop] 2
          getWord $dont_drop $second_word 3
          if ($second_word <> "are")
          setvar $game_alien[$alien_loop] $game_alien[$alien_loop] & " " & $second_word
          end
          goto :alien_loop
:initiate
         Killtrigger 1
         setvar $loop 1
         while ($loop < $alien_loop)
         setTextTrigger $loop+10 :Alien $game_alien[$loop]& " Space"
         add $loop 1
         end
:start
         settextTrigger Script :Script "Script?"
         pause


:Alien
      Getword CURRENTLINE $sector 3
      Getword CURRENTLINE $AlienRace 5
      send "'"&$AlienRace &" in : "& $sector & #7 & "*"
      if ($sound)
      sound ding.wav
      end
      write $filename $AlienRace & " in :" & $sector
      goto :start

      halt

:Script
killtrigger Script
send "'Maniac's AlienHunter "& $version &" running *"
goto :start



:Brag
echo ANSI_12 &"*======================================"
echo ANSI_12 &"*Maniac's AlienHunter "& $version
echo ANSI_12 &"*======================================*"
send "'Maniac's AlienHunter "& $version &" running *"
return