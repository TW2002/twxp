####################################################################################################
:Planet_Driver_Mode
      send "' RammaR's Planet Driver for Gridding Loaded - Ver. 2.2*"
      waitFor "Message sent on sub-space channel"
      # echo ANSI_12&"**WARNING: " ANSI_15&"You " ANSI_13&"MUST" ANSI_15&" stay at the " ANSI_13&"Citadel Prompt" ANSI_15&" for the script to work.*"
      # echo ANSI_14&"*Use the '" ANSI_12&"-" ANSI_14&"' key to activate the " ANSI_10&"Special Features " ANSI_14&"Menu.*"
     
:Wait_For_Call
      killAllTriggers
      setTextLineTrigger 50 :Get_Door_Number "P-Gridder Ready for Door:"
      setTextTrigger Abort_Reset :Wait_For_Call "Gridding Aborted - Enemy in sector!"
      setTextTrigger Warped_Early :Return_Planet "LAG / Fig Error - Driver bring back planet."
      setTextOutTrigger 99 :Special_Options_Menu "-"
      pause

:Get_Door_Number
      getText CURRENTLINE $TargetDoor "for Door: " " - Planet Mover"
      stripText $TargetDoor " "

:Verify_Cit_Prompt
      send "/"
      waitFor "³Turns"
      getWord CURRENTLINE $StartSector 2
      stripText $StartSector "³Turns"
      waitFor "(?="
      cutText CURRENTLINE $prompt 1 7
      if ($prompt <> "Citadel")
            send "' Planet Mover not at proper prompt - Reset Gridder.*"
            waitFor "Message sent on sub-space channel"
            echo ANSI_12&"** You must be at the Citadel prompt to activate the script - waiting Activation.*"
            goto :Wait_For_Call
      end                  
     
      setVar $target SECTOR.WARPS[$startSector][$TargetDoor]
      if ($target = 0)
            send "s* "
            waitFor "Sector  :"
            waitFor "Citadel command"
            setVar $target SECTOR.WARPS[$startSector][$TargetDoor]
            if ($target = 0)
                  send "'Planet Mover is having difficulty with door - Reset and Try again.*"
                  waitFor "Message sent on sub-space channel"
                  goto :Wait_For_Call
            end
      end
      send "'Planet Mover Ready for Door " $TargetDoor ".*"
#       echo "** The Target is: " $target "*"

:Pause_For_Gridder
      setVar $warp_attempts 1
      setTextTrigger 51 :PWarp "Density in Target Sector OK:"
      setTextTrigger 52 :High_Density "Density in Target Sector TOO HIGH:"
      setTextTrigger 53 :Aborting_Move "Reset Planet Driver"
      pause

:Pwarp
      killTrigger 52
      waitFor "lifts off from"

:Attempt_Warp
      killTrigger Abort_Reset
      while ($warp_attempts <= 5)
            send "p " $target "* Y "
            add $warp_attempts 1
      end
      setTextTrigger 20 :resend_Pwarp "away from here."
      setTextTrigger 21 :Warped_Ok "You are already in that sector!"
      setTextTrigger 22 :Aborting_Move "Aborting sector!"
      setTextTrigger 23 :Aborting_Move "Enemy in sector!"
      setTextTrigger 24 :Aborting_Move "Density Spoofing drew enemy photon"
      pause

:Resend_Pwarp
      send "p " $target "* Y "
      add $warp_attempts 1
      if ($warp_attempts > 150)
            goto :Warp_Failed
      end
      setTextTrigger 20 :Resend_Pwarp "away from here."
      pause

:Aborting_Move
      killAllTriggers
      send "* *"
      send "' Planet Driver Reset - Waiting for next activation.*"
      waitFor "Message sent on sub-space channel"
      echo ANSI_10&"** Wait at the Citadel Prompt for the next activation.*"
      goto :Wait_For_Call

:Warped_Ok
      killAllTriggers
      send "' Planet SUCCESSFULLY moved to gridded sector.*"
      waitFor "Message sent on sub-space channel"
      send " s* c r*q "
      echo ANSI_10&"** Wait at the Citadel Prompt for the next activation.*"
      goto :Wait_For_Call
     
:Warp_Failed
      killAllTriggers
      send "' Planet FAILED to move - Script Halting! Corpie may be in trouble.*"
      waitFor "Message sent on sub-space channel"
      echo ANSI_12&"** Planet move FAILED! Script Halted. Corpie may be in trouble!*"
      halt

:High_Density
      killTrigger 51
      echo ANSI_10&"** Wait at the Citadel Prompt for the next activation.*"
      goto :Wait_For_Call

:Return_Planet
      killAllTriggers
      send "p " $StartSector "* y "
      send "'Planet Returned.*"
      waitFor "Message sent on sub-space channel"
      goto :Wait_For_Call
