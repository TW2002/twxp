
# ###################################################

:dropCorp
setTextTrigger notcorped :notcorped "You are not currently in a Corporation!"
setTextTrigger dropped :dropped "Ok!  You're off the Corp..."
if ($prompt = "Citadel")
	send "xxyq"
	pause
elseif ($prompt = "Command")
	send "txyq"
	pause
end

:dropped 
killtrigger notcorped
setVar $dropCorp 1
return

:notcorped
killtrigger dropped
setVar $dropCorp 0
return

# #####################################################

:joinCorp
if ($prompt = "Citadel")
	send "x"
elseif ($prompt = "Command")
	send "t"
end

send "j" $corpnum "*"
setTextTrigger alignconf :alignconf "Sorry, you can only join a Corporation if your alignment doesn't conflict."
setTextTrigger corpfull :corpfull "Current Federal Regulations prohibit more than"
setTextTrigger noexist :corpnoexist "Sorry, that Corp is not active."
setTextTrigger enterpass :enterpass "Enter the Password to join"
pause

:enterpass
killtrigger alignconf
killtrigger corpfull
killtrigger noexist
setTextTrigger notin :notincorp "Nice try, that has been recorded by Federal Intelligence."
setTextTrigger incorp :incorp "Welcome aboard!  You're in!"
send $corppass "*"
pause

:notincorp
killtrigger incorp
setVar $corpNum "-1"
send "q"
return

:alignconf
killtrigger noexist
killtrigger enterpass
killtrigger corpfull
setVar $corpNum "-2"
send "q"
return

:corpfull
killtrigger noexist
killtrigger enterpass
killtrigger alignconf
setVar $corpNum "-3"
send "q"
return

:corpnoexist
killtrigger alignconf
killtrigger corpfull
killtrigger enterpass
setVar $corpNum "-4"
send "Q"
return

:incorp
killtrigger notin
send "q"
return

# ########################################################
:giveFigs
send "tf"
gosub :triggers
if ($giveFigs >= 0)
	send "t"
	setTextLineTrigger howmany :gf_howmany "fighters, and"
	pause

	:gf_howmany
	getText CURRENTLINE $ours "have " " fighters,"
	getText CURRENTLINE $theirs "has " "."

	if ($giveFigs = 0)
		send $ours "*"
	else
		if ($giveFigs > $ours)
			setVar $giveFigs $ours
		end
		send $giveFigs "*"
	end

	setTextTrigger toomany :gf_toomany "fighters."
	setTextTrigger done :gf_done "You have "
	pause

	:gf_toomany
	killtrigger done
	getText CURRENTLINE $theirsmax "carry " " fighters."
	setVar $max ($theirsmax - $theirs)
	setVar $giveFigs $max
	if ($giveFigs = 0)
		goto :gf_done
	end
	send "f"
	setVar $nloop 0

	:gf_nloop
	if ($nloop < $nos)
		add $nloop 1
		send "n"
		goto :gf_nloop
	end 
	send "yt" $giveFigs "*"

	:gf_done
	killtrigger toomany
	send "q"
	return
else
	send "q"
	return
end
return

# ############################################################
:takeFigs

send "tf"
gosub :triggers
if ($takeFigs >= 0)
	send "f"
	setTextLineTrigger howmany :tf_howmany "fighters, and"
	pause

	:tf_howmany
	getText CURRENTLINE $ours "have " " fighters,"
	getText CURRENTLINE $theirs "has " "."

	if ($takeFigs = 0)
		send $theirs "*"
	else
		if ($takefigs > $theirs)
			setVar $takeFigs $theirs
		end
		send $takeFigs "*"
	end

	setTextTrigger toomany :tf_toomany "fighters!"
	setTextTrigger done :tf_done "You have "
	pause

	:tf_toomany
	killtrigger done
	getText CURRENTLINE $oursmax "carry " " fighters!"
	setVar $max ($oursmax - $ours)
	setVar $takeFigs $max
	if ($takeFigs = 0)
		goto :gf_done
	end
	send "f"
	setVar $nloop 0
	
	:tf_nloop
	if ($nloop < $nos)
		add $nloop 1
		send "n"
		goto :tf_nloop
	end 
	
	send "yf" $takeFigs "*"
	

	:tf_done
	killtrigger toomany
	send "q"
	return
else
	send "q"
	return
end

return

# ##############################################################
:giveShields
send "ts"
gosub :triggers
if ($giveshields >= 0)
	send "t"
	setTextLineTrigger howmany :gs_howmany "shields, and"
	pause
	:gs_howmany
	getText CURRENTLINE $ours "have " " shields,"
	getText CURRENTLINE $theirs "has " "."
	if ($giveShields = 0)
		send $ours "*"
	else
		if ($giveShields > $ours)
			setVar $giveShields $ours
		end
		send $giveShields "*"
	end
	setTextTrigger toomany :gs_toomany "shields."
	setTextTrigger done :gs_done "You have "
	pause
	
	:gs_toomany
	killtrigger done
	getText CURRENTLINE $theirsmax "have " " shields."
	setVar $max ($theirsmax - $theirs)
	setVar $giveShields $max
	if ($giveShields = 0)
		goto :gs_done
	end
	send "s"
	setVar $nloop 0
	
	:gs_nloop
	if ($nloop < $nos)
		add $nloop 1
		send "n"
		goto :gs_nloop
	end 	
	send "yt" $giveShields "*"
	
	
	:gs_done
	killtrigger toomany
	send "q"
	return
else
	send "q"
	return
end

return
# ##############################################################
:takeShields
send "ts"
gosub :triggers
if ($takeshields >= 0)
	send "f"
	setTextLineTrigger howmany :ts_howmany "shields, and"
	pause
	:ts_howmany
	getText CURRENTLINE $ours "have " " shields,"
	getText CURRENTLINE $theirs "has " "."
	if ($takeShields = 0)
		setVar $takeShields $theirs
	else
		if ($takeShields > $theirs)
			setVar $takeShields $theirs
		end
	end
	send $takeShields "*"
	setTextTrigger toomany :ts_toomany "shields!"
	setTextTrigger done :ts_done "You have "
	pause
	
	:ts_toomany
	killtrigger done
	getText CURRENTLINE $oursmax "have " " shields!"
	setVar $max ($oursmax - $ours)
	setVar $takeShields $max
	if ($takeShields = 0)
		goto :ts_done
	end		
	send "s"
	setVar $nloop 0
	
	:ts_nloop
	if ($nloop < $nos)
		add $nloop 1
		send "n"
		goto :ts_nloop
	end 	
	send "yf" $takeShields "*"
	
	:ts_done
	killtrigger toomany
	send "q"
	return
else
	send "q"
	return
end

return
# ###########################################################
:giveCreds
send "tc"
gosub :triggers
setTextLineTrigger onhand :onhand "credits, and"
send "t"
pause

:onhand 
getText CURRENTLINE $ourcreds "have " " credits,"
stripText $ourcreds ","
if ($giveCreds = 0)
	setVar $giveCreds $ourcreds
elseif ($giveCreds > 0)
	if ($giveCreds > $ourcreds)
		setVar $giveCreds $ourcreds
	end
elseif ($giveCreds < 0)
	setVar $diff ($ourcreds + $giveCreds)
	if ($diff < 0)
		setVar $giveCreds 0
	else
		setVar $giveCreds $diff
	end
end
send $giveCreds "*q"
return

# ############################################################
:takeCreds
send "tc"
gosub :triggers
setTextLineTrigger onhand :fromhand "credits, and"
send "f"
pause

:fromhand
getText CURRENTLINE $theircreds "has " "."
stripText $theirCreds ","
if ($takeCreds = 0)
	setVar $takeCreds $theircreds
elseif ($takeCreds > 0)
	if ($takeCreds > $theircreds)
		setVar $takeCreds $theircreds
	end
elseif ($takeCreds < 0)
	setVar $diff ($theircreds + $takeCreds)
	if ($diff < 0)
		setVar $takeCreds 0
	else
		setVar $takeCreds $diff
	end
end
send $takeCreds "*q"
return

# ###########################################################
:giveMines
send "th"
if ($mineType = 1)
	send "a"
else
	send "l"
end
gosub :triggers
if ($giveMines >= 0)
	setTextLineTrigger howmany :gm_howmany "mines, and"
	send "T"
	pause
	
	:gm_howmany
	if ($mineType = 1)
		getText CURRENTLINE $ours "have " " Armid"
	else
		getText CURRENTLINE $ours "have " " Limpet"
	end
	getText CURRENTLINE $theirs "has " "."
	if ($giveMines = 0)
		setVar $giveMines $ours
	else
		if ($giveMines > $ours)
			setVAr $giveMines $ours
		end
	end
	send $giveMines "*"
	setTextTrigger toomany :gm_toomany "mines."
	setTextTrigger done :gm_done "You have "
	pause

	:gm_toomany
	killtrigger done
	if ($mineType = 1)
		getText CURRENTLINE $theirsmax "have " " Armid"
	else
		getText CURRENTLINE $theirssmax "have " " Limpet"
	end
	setVar $max ($theirsmax - $theirs)
	setVar $giveMines $max
	if ($giveMines = 0)
		goto :gm_done
	end		
	send "h"
	if ($mineType = 1)
		send "a"
	else
		send "l"
	end
	setVar $nloop 0
	
	:gm_nloop
	if ($nloop < $nos)
		add $nloop 1
		send "n"
		goto :gm_nloop
	end 
	send "yt" $giveMines "*"
	
	:gm_done
	killtrigger toomany
	send "q"
	return
else
	send "Q"
	return
end
# ############################################################
:takeMines
send "th"
if ($mineType = 1)
	send "a"
else
	send "l"
end
gosub :triggers
if ($giveMines >= 0)
	setTextLineTrigger howmany :tm_howmany "mines, and"
	send "f"
	pause
	
	:tm_howmany
	if ($mineType = 1)
		getText CURRENTLINE $ours "have " " Armid"
	else
		getText CURRENTLINE $ours "have " " Limpet"
	end
	getText CURRENTLINE $theirs "has " "."
	if ($takeMines = 0)
		setVar $takeMines $theirs
	else
		if ($takeMines > $theirs)
			setVAr $takeMines $theirs
		end
	end
	send $takeMines "*"
	setTextTrigger toomany :tm_toomany "mines!"
	setTextTrigger done :tm_done "You have "
	pause

	:tm_toomany
	killtrigger done
	if ($mineType = 1)
		getText CURRENTLINE $oursmax "have " " Armid"
	else
		getText CURRENTLINE $oursmax "have " " Limpet"
	end
	setVar $max ($oursmax - $ours)
	setVar $takeMines $max
	if ($takeMines = 0)
		goto :gm_done
	end		
	send "h"
	if ($mineType = 1)
		send "a"
	else
		send "l"
	end
	setVar $nloop 0
	
	:tm_nloop
	if ($nloop < $nos)
		add $nloop 1
		send "n"
		goto :tm_nloop
	end 
	send "yf" $takeMines "*"
	
	:tm_done
	killtrigger toomany
	send "q"
	return
else
	send "Q"
	return
end
return

:triggers
setVar $nos 0
setTextTrigger xwith :xwith "(Y/N) [N]?"
setTextTrigger nocorp :nocorp "You're not even "
setTextTrigger nosec :nosec "Your Associate must b"
pause

:nocorp
killtrigger xwith
killtrigger nosec
setVar $giveFigs "-1"
setVar $takeFigs "-1"
setVar $giveShields "-1"
setVar $takeShields "-1"
setVar $giveMines "-1"
setVar $takeMines "-1"
setVAr $giveCreds "-1"
setVar $takeCreds "-1"
return

:nosec
killtrigger xwith
killtrigger nocorp
setVar $giveFigs "-2"
setVar $takeFigs "-2"
setVar $giveShields "-2"
setVar $takeShields "-2"
setVar $giveMines "-2"
setVar $takeMines "-2"
setVAr $giveCreds "-2"
setVar $takeCreds "-2"
return

:nothere
killtrigger xwith
setVar $giveFigs "-3"
setVar $takeFigs "-3"
setVar $giveShields "-3"
setVar $takeShields "-3"
setVar $giveMines "-3"
setVar $takeMines "-3"
setVAr $giveCreds "-3"
setVar $takeCreds "-3"
return

:xwith
killtrigger nocorp
killtrigger nosec
killtrigger nothere
getText CURRENTLINE $name "with " " (Y/N)"
getLength $target $length
cutText $name $name 1 $length
if ($name = $target)
	send "y"
	return
else
	add $nos 1
	setTextTrigger xwith :xwith "(Y/N) [N]?"
	setTextTrigger nothere :nothere "Corporate command [TL="
	send "n"
	pause
end

