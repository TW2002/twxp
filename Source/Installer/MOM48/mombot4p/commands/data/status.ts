	gosub :BOT~loadVars

	setVar $BOT~help[1] $BOT~tab&"Reports information about bot on subspace  "
	setVar $BOT~help[2] $BOT~tab&"        "
	setVar $BOT~help[3] $BOT~tab&"Special stats that are bot specific:        "
	setVar $BOT~help[4] $BOT~tab&"  - Planet #: Last planet landed on"
	setVar $BOT~help[5] $BOT~tab&"  - Team Name: What team name your bot respondeds to, if any"
	setVar $BOT~help[6] $BOT~tab&"  - Bot mode:  What mode your bot is currently running"
	setVar $BOT~help[7] $BOT~tab&"        "
	gosub :bot~helpfile

	loadvar $planet~planet
	loadvar $bot~mode
	loadvar $BOT~bot_team_name

 # ============================== QSS ==============================
:qss
:status
	gosub :PLAYER~quikstats
	setvar $fedsafe false
	if (($player~experience < 1000) and ($player~alignment >= 0))
		setvar $fedsafe true
	end
	setVar $PLAYER~startingLocation $PLAYER~CURRENT_PROMPT
	if ($BOT~mode = "General")
		if (($PLAYER~startingLocation = "Command") or ($PLAYER~startingLocation = "Citadel"))
			gosub :PLAYER~getInfo
			if ($PLAYER~NOFLIP)
				send "CQ"
			else
				send "C N 9 Q Q "
			end
			waiton "Computer command [TL="
			getText CURRENTLINE $timeLeft "Computer command [TL=" "]:"
		else
			setVar $igstat "Bad Prompt"
			setVar $timeLeft "Bad Prompt"
		end
	else
		setVar $igstat "Busy"
		setVar $timeLeft "Busy"        
	end
	setArray $h 35
	setArray $qss 35
	setArray $qss_var 35

	setVar $h[1]  "Sector   :"
	setVar $h[2]  "Turns    :"
	setVar $h[3]  "Credits  :"
	setVar $h[4]  " Fighters  :"
	setVar $h[5]  " Shields   :"
	setVar $h[6]  "Holds    :"
	setVar $h[7]  "Fuel Ore :"
	setVar $h[8]  "Organics :"
	setVar $h[9]  "Equipment:"
	setVar $h[10] "Colonists:" 
	setVar $h[11] "Photons  :"
	setVar $h[12] " Armids   :"
	setVar $h[13] " Limpets  :"
	setVar $h[14] " Gen-Torps:"
	setVar $h[15] " Transwarp :"
	setVar $h[16] "Cloaks    :"
	setVar $h[17] " Beacons   :"
	setVar $h[18] " AtomicDet:"
	setVar $h[19] " Corbomite :"
	setVar $h[20] " E-Probes :"
	setVar $h[21] " Disruptor:"
	setVar $h[22] " PsiProbe  :"
	setVar $h[23] " PlanetScn:"
	setVar $h[24] " Scanner  :"
	setVar $h[25] " Alignment :"
	setVar $h[26] " Experience:"
	setVar $h[27] " Ship ID   :"
	setVar $h[28] " Planet # :"
	setVar $h[29] "Time Left:"
	setVar $h[30] "     Prompt:"
	setVar $h[31] " IG Status:"
	setVar $h[32] "  Bot Mode :"
	setVar $h[33] " Team Name :"
	setVar $h[34] "Planet #  :"
	setVar $h[35] " Fed Safe: "
	setVar $qss[1] $PLAYER~CURRENT_SECTOR
	if ($PLAYER~unlimitedGame)
		setVar $qss[2] "Unlim"
	else
		setVar $qss[2] $PLAYER~TURNS
	end
	setVar $qss[3] $PLAYER~CREDITS
	setVar $qss[4] $PLAYER~FIGHTERS
	setVar $qss[5] $PLAYER~SHIELDS
	setVar $qss[6] $player~total_holds
	setVar $qss[7] $player~ore_holds
	setVar $qss[8] $player~organic_holds
	setVar $qss[9] $player~equipment_holds
	setVar $qss[10] $player~colonist_holds
	setVar $qss[11] $PLAYER~PHOTONS
	setVar $qss[12] $PLAYER~ARMIDS
	setVar $qss[13] $PLAYER~LIMPETS
	setVar $qss[14] $PLAYER~GENESIS
	setVar $qss[15] $PLAYER~TWARP_TYPE
	setVar $qss[16] $PLAYER~CLOAKS
	setVar $qss[17] $PLAYER~BEACONS
	setVar $qss[18] $PLAYER~ATOMIC
	setVar $qss[19] $PLAYER~CORBO
	setVar $qss[20] $PLAYER~EPROBES
	setVar $qss[21] $PLAYER~MINE_DISRUPTORS
	setVar $qss[22] $PLAYER~PSYCHIC_PROBE
	setVar $qss[23] $PLAYER~PLANET_SCANNER
	setVar $qss[24] $PLAYER~SCAN_TYPE
	setVar $qss[25] $PLAYER~ALIGNMENT
	setVar $qss[26] $PLAYER~EXPERIENCE
	setVar $qss[27] $PLAYER~SHIP_NUMBER
	if (($PLAYER~startingLocation = "Planet") OR ($PLAYER~startingLocation = "Citadel"))
		if ($planet~planet = "0")
			setVar $qss[28] "None"
		else
			setVar $qss[28] $planet~planet
		end
	else
		setVar $qss[28] "None"
	end
	if ($timeLeft = "00:00:00")
		setVar $qss[29] "Unlim"
	else
		setVar $qss[29] $timeLeft
	end
	
	if (($PLAYER~startingLocation = "Planet") OR ($PLAYER~startingLocation = "Citadel") OR ($PLAYER~startingLocation = "Corporate") OR ($PLAYER~startingLocation = "Command"))
		setVar $qss[30] $PLAYER~startingLocation
	else
		setVar $prompt $PLAYER~FULL_CURRENT_PROMPT
		getLength $prompt $prompt_length
		if ($prompt_length > 10)
			cutText $prompt $prompt 1 10
		end
		setVar $qss[30] $prompt
	end
	setVar $qss[31] $PLAYER~igstat
	setVar $qss[32] $BOT~mode
	if (($BOT~bot_team_name = "all") OR ($BOT~bot_team_name = FALSE))
		setVar $qss[33] "None"
	else
		setVar $qss[33] $BOT~bot_team_name
	end
	if ($planet~planet = "0")
		setVar $qss[34] "None"
	else
		setVar $qss[34] $planet~planet
	end
	if ($fedsafe = true)
		setVar $qss[35] "Yes"
	else
		setVar $qss[35] "No"
	end

	setVar $qss_ss 0
	setVar $qss_count 1
	setVar $spc " "
	setVar $overall 15
:qss_gather
	while ($qss_count <= 35)
		setVar $spc_count 1
		#upperCase $h[$qss_count]
		setVar $qss_var[$qss_count] $h[$qss_count]&$qss[$qss_count]
		setVar $total_length 18
		getLength $qss_var[$qss_count] $text_length
		subtract $total_length $text_length
		while ($total_length >= 0)
			setVar $qss_var[$qss_count] $qss_var[$qss_count]&$spc 
			subtract $total_length 1
		end
		add $qss_count 1
	end
:qss_send
						 setVar $SWITCHBOARD~message "                    --- Status Update ---                        *"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"----------------------------------------------------------------*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[1]&$qss_var[27]&$qss_var[28]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[3]&$qss_var[4]&$qss_var[13]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[2]&$qss_var[5]&$qss_var[12]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[11]&$qss_var[25]&$qss_var[21]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[6]&$qss_var[26]&$qss_var[20]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[7]&$qss_var[17]&$qss_var[14]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[8]&$qss_var[22]&$qss_var[18]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[9]&$qss_var[19]&$qss_var[23]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[10]&$qss_var[15]&$qss_var[24]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"  "&$qss_var[29]&$qss_var[33]&$qss_var[31]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"    *"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&$qss_var[32]&"  "&$qss_var[30]&"    "&$qss_var[35]&"*"
	setVar $SWITCHBOARD~message $SWITCHBOARD~message&"----------------------------------------------------------------**"
	
	if ($SWITCHBOARD~self_command <> TRUE)
		setVar $SWITCHBOARD~self_command 2
	else
		setVar $SWITCHBOARD~message "   *"&$SWITCHBOARD~message
	end
	gosub :SWITCHBOARD~switchboard
halt
# ============================== END QSS SUB ==============================






# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\bot_includes\player\quikstats\player"
include "source\bot_includes\player\getinfo\player"
