# -------------------------------------------------------------------
# Dnyarri target script by Aaron Colman, aaron@ibasics.biz.
#
# This script is released under the GPL on June 8th, 2005
# Go here for the license: http://www.gnu.org/copyleft/gpl.html
#
# Basically it means 3 things.
# 1. You can edit and use the scripts as you wish provded that:
# 2. You release the source code for any changes and
# 3. Give credit to the original author(s) in any such mods
#
# Version 1.0. A simple and sweet attack script. Enter the target
# and when you see em it will attack with a number of figs and
# a number of waves. Once it's done it will retreat to the safety
# of another sector. If you have twarp and some fuel then you can
# retreat to safety via twarp. Otherwise it tries a simple retreat.
# It's smart enough not to attack a fed (unless you tell it to)
# or attack the wrong person.
# -------------------------------------------------------------------

:quickstats
     send "/"
     settextlinetrigger getStats :getStats
     settexttrigger command :gotStats "Command"
pause

:getStats
     killtrigger getStats
     if (CURRENTLINE <> "")
         setvar $stats $stats & CURRENTLINE
         replacetext $stats #179 " "
         striptext $stats ","
         settextlinetrigger getStats :getStats
         pause
     else
         settextlinetrigger getStats :getStats
         pause
     end

:gotStats
     killtrigger command
     killtrigger getStats
     getWordPos $stats $pos "TWarp"
     setVar $twarp_pos ($pos + 6)
     cutText $stats $twarp_status $twarp_pos 1

     getinput $target_dude "Target (case sensitive): "
     getinput $hit_with_num "Number of figs to attack with: "
     getinput $max_waves "Maximum number of attack waves: "

     if ($twarp_status > 0)
            getinput $twarp_retreat "Twarp retreat to: "
     else
            setVar $twarp_retreat 0
     end

     # Bounds check the hit with
     isNumber $result $hit_with_num
     if ($hit_with_num = "") 
           setVar $hit_with_num 100
     end
     if ($result = 0)
           setVar $hit_with_num 100
     else
           if ($hit_with_num < 1)
                setVar $hit_with_num 100
           end
     end

     # Bounds check the twarp retreat
     isNumber $result $twarp_retreat
     if ($twarp_retreat = "") 
           setVar $twarp_retreat 0
     end
     if ($result = 0)
           setVar $twarp_retreat 0
     else
           if ($twarp_retreat < 1)
                setVar $twarp_retreat 0
           end
     end

     # Bounds check the waves
     isNumber $result $max_waves
     if ($max_waves = "") 
           setVar $max_waves 1
     end
     if ($result = 0)
           setVar $max_waves 1
     else
           if ($max_waves < 1)
                setVar $max_waves 1
           end
     end
 
     setvar $current_wave 0

     echo ANSI_12 "**Starting attack script...**" ANSI_11
goto :set_triggers

:set_triggers
     killalltriggers

     if ($current_wave >= $max_waves)
           goto :conclude_attack
     end

     setTextTrigger lift :hit_me $target_dude & " blasts off from the StarDock"
     setTextTrigger twrp :hit_me $target_dude & " appears in a brilliant flash of warp energies!"
     setTextTrigger warp :hit_me $target_dude & " warps into the sector."
     setTextTrigger port :hit_me $target_dude & " lifts off from"
     setTextTrigger disp :trader "Traders : "
     send "D"
pause

:trader
    # Checks if they're in the display list...
    setVar $line CURRENTLINE
 
    # No more traders, exit.
    getWordPos $line $pos "Command [TL="
    if ($pos > 0)
          goto :set_triggers
    end

    # Checking traders in display list.
    getWordPos $line $pos $target_dude
    if ($pos > 0)
          # Target found! Start the attack!
          goto :hit_me
    end
goto :trader

:hit_me
    killalltriggers
    setDelayTrigger no_more_traders :set_triggers 1000
    setTextTrigger attack_prompt :hit_loop "(Y/N)"
    send "A"
pause

# Attack started...

:hit_loop
    # setTextTrigger no_more_traders :set_triggers "Command [TL="
    setVar $line CURRENTLINE

    # Someone to attack. Right person?
    getWordPos $line $pos $target_dude
    if ($pos > 0)
           # Correct target, start the attack!
           send "y" $hit_with_num "*"
           setTextTrigger attack_bad :attack_failed "There is nothing here to attack."
           setTextTrigger attack_good :attack_complete "remain."
           pause
    else
           # Not the correct target.
           send "N"
    end
goto :hit_me

:attack_complete
     setvar $current_wave ($current_wave + 1)
goto :set_triggers

:attack_failed
     # Attack failed, retry later.
goto :set_triggers

:conclude_attack
   killalltriggers
   if ($twarp_retreat <= 0)
          processOut "<"
   else
          setTextTrigger no_blind :no_blind "Do you want to make this jump blind?"
          setTextTrigger no_fuel :twarp_failed "You do not have enough Fuel Ore to make the jump."
          setTextTrigger twarp_ready :twarp_ready "All Systems Ready, shall we engage?"
          send "M" $twarp_retreat "*Y"
          pause
   end
goto :prog_end

:twarp_ready
    send "Y"
goto :prog_end

:no_blind
    killalltriggers
    send "N"
goto :twarp_failed

:twarp_failed
    killalltriggers
    processOut "<"
goto :prog_end

:prog_end
   # Clean exit
halt

