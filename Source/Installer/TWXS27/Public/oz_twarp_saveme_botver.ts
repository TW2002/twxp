send #145
waitfor "(?="
:start
	cutText CURRENTLINE $location 1 7

	if ($location <> "Command") and ($location <> "Citadel")
       		clientMessage "This script must be run from the Command or Citadel Prompt"
        	halt
	end
:type
	if ($location = "Command")
		setVar $type "TWarp"
		send "dzn"
		waitFor "Sector  :"
		getWord CURRENTLINE $sector 3
	elseif ($location = "Citadel")
		setVar $type "BWarp"
		send "qd"
		waitFor "Planet #"
		getWord CURRENTLINE $planet 2
		stripText $planet "#"
		send " t n l 1* t n l 2* t n l 3* s n l 1* s n l 2* s n l 3* t n t 1* c s* "
		waitFor "Sector  :"
		getWord CURRENTLINE $sector 3
	end

        # Load and reset variable.
        loadVar $tsaveme_scrub
        setVar $scrub $tsaveme_scrub
        setVar $tsaveme_scrub ""
        saveVar $tsaveme_scrub

        # Specified scrub? 
        isNumber $number $scrub
        if ($number < 1)
                SetVar $scrub $sector
        end

	send "'OZ " $type " Saveme Active - Awaiting Distress Call.*"
	
:main
	setTextLineTrigger trigger :trigger "=saveme"
	pause

:trigger
	cutText CURRENTLINE $spoof 1 1
	if ($spoof <> "R")
		goto :main
	end
	getText CURRENTLINE $line "R" "=saveme"
	cutText $line $corpy 2 6
	stripText $line $corpy
	stripText $line "R"
	stripText $line "=saveme"
	stripText $line " "
	setVar $savesec $line
	setVar $pos1 5
:pos_loop
	cutText $corpy $blank_ck $pos1 1
	if ($blank_ck = " ")
		cutText $corpy $corpy 1 $pos1
		subtract $pos1 1
		setVar $check2 1
		goto :pos_loop
	end
	if ($check2 = 1)
		cutText $corpy $corpy 1 $pos1

	end
:cut_zero
	stripText $savesec " "
	cutText $savesec $zero_ck 1 1
	if ($zero_ck = 0)
		cutText $savesec  $savesec 2 5
		goto :cut_zero
	end
	
:save_em
	if ($type = "TWarp")
		setVar $twarp_sector $savesec
		setVar $go 1
		goto :twarp
	elseif ($type = "BWarp")
		setVar $bwarp_sector $savesec
		setVar $go 1
		goto :bwarp
	end
:go1
	send "f"
	setTextLineTrigger total_figs :total_figs "fighters available."
	setTextLineTrigger sec_figs :sec_figs "Your ship can support up to"
	pause

:total_figs
	getWord CURRENTLINE $total_figs 3
	stripText $total_figs ","
	pause
	
:sec_figs 
	getWord CURRENTLINE $sec_figs 10
	stripText $sec_figs ","
	if ($total_figs <= 50000)
		send $total_figs "*cdzn"
	else
		send "50000*cd*"
	end
	send "tfyf"
	setTextLineTrigger corpy_figs :corpy_figs "fighters, and"
	pause

:corpy_figs
        setVar $current_line CURRENTLINE

        setVar $key_idx 1
        while ($key_idx <= 20)
            getword $current_line $wordy $key_idx
            if ($wordy = "has")
                 setVar $ftr_word ($key_idx + 1)
                 goto :got_word_num
            end
            add $key_idx 1
        end

        :got_word_num
        getword $current_line $corpy_figs $ftr_word
        stripText $corpy_figs "."
        stripText $corpy_figs ","

	send $corpy_figs "*qzn"
	send "wy" $corpy "*y*zn"
	send "tfyt" $corpy_figs "*qzn"
	send "f"
	if ($sec_figs > 1)
		send $sec_figs
	else
		send "1"
	end
	send "*c d z n "

:go_scrub
	setVar $twarp_sector $scrub
	setVar $go 2
	goto :twarp
	

# -=-=-=-=-=-=-=-twarp subroutine-=-=-=-=-=-=-=-=-=-
:twarp
	send "m" $twarp_sector "*y"
	waitFor "To which Sector"
	setTextLineTrigger twarp_lock :twarp_lock "TransWarp Locked"
	setTextLineTrigger no_twrp_lock :no_twarp_lock "No locating beam found"
	setTextLineTrigger twarp_adj :twarp_adj "<Set NavPoint>"
	setTextLineTrigger no_ore :no_ore "You do not have enough Fuel Ore"
	pause


:no_ore
	send "'OZ " $type " Saveme - No ore!!*"
	halt


:twarp_adj
	send "**"
	killAllTriggers
	if ($go = 1)
		goto :go1
	elseif ($go = 2)
		goto :go2
	end

:twarp_lock
	KillAlltriggers
	send "y*"
	waitFor "Warps to Sector(s)"
	if ($go = 1)
		goto :go1
	elseif ($go = 2)
		goto :go2
	end

:no_twarp_lock
	killAllTriggers
	send "n*"
	send "'OZ " $type " Saveme - Can't Get Lock! - Fig and Call Save!*"
	goto :main

# -=-=-=-=-=-=-=- bwarp subroutine -=-=-=-=-=-=-=-=-=-
:bwarp
	send "b" $bwarp_sector "*"
	setTextLineTrigger beam_lock :beam_lock "TransWarp Locked"
	setTextLineTrigger no_beam_lock :no_beam_lock "No locating beam found"
	pause
:beam_lock
	killAllTriggers
	send "y*"
	waitFor "Warps to Sector(s)"
	if ($go = 1)
		goto :go1
	elseif ($go = 2)
		goto :go2
	end

:no_beam_lock
	killAllTriggers
	send "n*"
	send "'OZ " $type " Saveme - Can't Get Lock! - Fig and Call Save!*"
	goto :main
	
# -=-=-=-=-=- ending -=-=-=-=-=-=--=
:go2
        send " w * * z q n z q n "
        if ($type = "BWarp")
              setTextLineTrigger not_at_home :exit_completely "That planet is not in this sector."
              send " l " & $planet & "*"
              waitfor "Landing sequence engaged..."
              send " t n l 1* t n l 2* t n l 3* s n l 1* s n l 2* s n l 3* t n t 1* c s* "
              goto :main
        else
              send "'OZ " $type " Saveme - Arrived at Scrub Sector.*"
              send "'OZ " $type " Saveme - Please Exit/Enter to Remove Limpet.*"
              send "'OZ " $type " Saveme - Powering Down...*"
              send "**"
              halt
        end
halt

:exit_completely
send "'OZ " $type " Saveme - Arrived at Scrub Sector.*"
send "'OZ " $type " Saveme - Please Exit/Enter to Remove Limpet.*"
send "'OZ " $type " Saveme - Powering Down...*"
send "**"
halt
