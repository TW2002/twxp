:game~gamestats
setvar $game~did_gamestats false
if (($player~startinglocation = "0") or ($player~startinglocation = ""))
	if (($player~current_prompt = "Command") or ($player~current_prompt = "Citadel"))
		setvar $player~startinglocation $player~current_prompt
	end
end

if ($player~startinglocation = "Citadel")
	send "qqzn"
end
if (($player~startinglocation = "Command") or ($player~startinglocation = "Citadel"))
	setvar $game~did_gamestats true
	send "vqyn"
	send #42 "*"
	settextlinetrigger settings1 :findgold "Gold Enabled="
	settextlinetrigger settings2 :findmbbs "MBBS Compatibility="
	settextlinetrigger settings3 :findaliens "Internal Aliens="
	settextlinetrigger settings4 :findferrengi "Internal Ferrengi="
	settextlinetrigger settings5 :findmaxcommands "Max Commands="
	settextlinetrigger settings6 :findinactive "Inactive Time="
	settextlinetrigger settings7 :findcoloregen "Colonist Regen Rate="
	settextlinetrigger settings8 :findphotondur "Photon Missile Duration="
	settextlinetrigger settings9 :finddebris "Debris Loss Percent="
	settextlinetrigger settings10 :findtradepercent "Trade Percent="
	settextlinetrigger settings11 :findproductionrate "Production Rate="
	settextlinetrigger settings12 :findmaxproductionrate "Max Production Regen="
	settextlinetrigger settings13 :findmultiplephotons "Multiple Photons="
	settextlinetrigger settings14 :findclearbusts "Clear Bust Days="
	settextlinetrigger settings15 :findstealfactor "Steal Factor="
	settextlinetrigger settings16 :findrobfactor "Rob Factor="
	settextlinetrigger settings17 :findportmax "Port Production Max="
	settextlinetrigger settings18 :findradiation "Radiation Lifetime="
	settextlinetrigger reregister :reregister "Reregister Ship="
	settextlinetrigger settings37 :findlimpetremoval "Limpet Removal="
	settextlinetrigger settings20 :findgenesis "Genesis Torpedo="
	settextlinetrigger settings21 :findarmid "Armid Mine="
	settextlinetrigger settings22 :findlimpet "Limpet Mine="
	settextlinetrigger settings23 :findbeacon "Beacon="
	settextlinetrigger settings24 :findtwarpi "Type I TWarp="
	settextlinetrigger settings25 :findtwarpii "Type II TWarp="
	settextlinetrigger settings26 :findtwarpupgrade "TWarp Upgrade="
	settextlinetrigger settings27 :findpsychic "Psychic Probe="
	settextlinetrigger settings28 :findplanetscanner "Planet Scanner="
	settextlinetrigger settings29 :findatomic "Atomic Detonator="
	settextlinetrigger settings30 :findcorbo "Corbomite="
	settextlinetrigger settings31 :findether "Ether Probe="
	settextlinetrigger settings32 :findphoton "Photon Missile="
	settextlinetrigger settings33 :findcloak "Cloaking Device="
	settextlinetrigger settings34 :finddisruptor "Mine Disruptor="
	settextlinetrigger settings35 :findholoscanner "Holographic Scanner="
	settextlinetrigger settings36 :finddensityscan "Density Scanner="
	settextlinetrigger settings38 :findmaxplanets "Max Planet Sector="
	settextlinetrigger settings39 :findmaxgameplanets ", sectors"
	settextlinetrigger settings40 :findfedspacephotons "FedSpace Photons="
	settextlinetrigger settings41 :findlatency "Latency="
	settextlinetrigger settings42 :finddelayshipmove "Ship Delay="
	settextlinetrigger settings43 :finddelayplanetmove "Planet Delay="
	settextlinetrigger settings44 :finddelayotherattacks "Other Attacks Delay="
	settextlinetrigger settings45 :finddelayshiptransporter "Ship Transporter Delay="
	settextlinetrigger settings46 :finddelayplanettransporter "Planet Transporter Delay="
	settextlinetrigger settings47 :finddelayeprobe "EProbe Delay="
	settextlinetrigger settings48 :finddelayphotonlaunch "Photon Launch Delay="
	settextlinetrigger settings49 :finddelayphotonwave "Photon Wave Delay="
	pause

	:game~findlatency
	getword currentline $game~latency 1
	striptext $game~latency "Latency="
	savevar $game~latency
	pause

	:game~finddelayshipmove
	setvar $game~delay 0
	setvar $game~delayword 2
	gosub :convertdelay
	setvar $game~delayship $game~delay
	savevar $game~delayship
	pause

	:game~finddelayplanetmove
	setvar $game~delay 0
	setvar $game~delayword 2
	gosub :convertdelay
	setvar $game~delayplanet $game~delay
	savevar $game~delayplanet
	pause

	:game~finddelayotherattacks
	setvar $game~delay 0
	setvar $game~delayword 3
	gosub :convertdelay
	setvar $game~delayotherattack $game~delay
	savevar $game~delayotherattack
	pause

	:game~finddelayshiptransporter
	setvar $game~delay 0
	setvar $game~delayword 3
	gosub :convertdelay
	setvar $game~delayshiptransporter $game~delay
	savevar $game~delayshiptransporter
	pause

	:game~finddelayplanettransporter
	setvar $game~delay 0
	setvar $game~delayword 3
	gosub :convertdelay
	setvar $game~delayplanettransporter $game~delay
	savevar $game~delayplanettransporter
	pause

	:game~finddelayeprobe
	setvar $game~delay 0
	setvar $game~delayword 2
	gosub :convertdelay
	setvar $game~delayeprobe $game~delay
	savevar $game~delayeprobe
	pause

	:game~finddelayphotonlaunch
	setvar $game~delay 0
	setvar $game~delayword 3
	gosub :convertdelay
	setvar $game~delayphotonlaunch $game~delay
	savevar $game~delayphotonlaunch
	pause

	:game~finddelayphotonwave
	setvar $game~delay 0
	setvar $game~delayword 3
	gosub :convertdelay
	setvar $game~delayphotondelay $game~delay
	savevar $game~delayphotondelay
	pause

	:game~findgold
	getword currentline $game~check 2
	striptext $game~check "Enabled="
	if ($game~check = "True")
		setvar $game~goldenabled true
		savevar $game~goldenabled
	else
		setvar $game~goldenabled false
		savevar $game~goldenabled
	end
	pause

	:game~findfedspacephotons
	getword currentline $game~check 2
	striptext $game~check "Photons="
	if ($game~check = "True")
		setvar $game~fedspacephotons true
		savevar $game~fedspacephotons
	else
		setvar $game~fedspacephotons false
		savevar $game~fedspacephotons
	end
	pause

	:game~findmaxplanets
	getword currentline $game~check 3
	striptext $game~check "Sector="
	setvar $game~max_planets_per_sector $game~check
	savevar $game~max_planets_per_sector
	pause

	:game~findmaxgameplanets
	getword currentline $game~check 9
	striptext $game~check "."
	setvar $game~max_planets_in_game $game~check
	savevar $game~max_planets_in_game
	pause

	:game~findmbbs
	getword currentline $game~mbbs_ck 2
	striptext $game~mbbs_ck "Compatibility="
	if ($game~mbbs_ck = "True")
		setvar $game~mbbs true
		savevar $game~mbbs
	elseif ($game~mbbs_ck = "False")
		setvar $game~mbbs false
		savevar $game~mbbs
	end
	pause

	:game~findaliens
	getword currentline $game~check 2
	striptext $game~check "Aliens="
	if ($game~check = "True")
		setvar $game~internalaliens true
		savevar $game~internalaliens
	elseif ($game~check = "False")
		setvar $game~internalaliens false
		savevar $game~internalaliens
	end
	pause

	:game~findferrengi
	getword currentline $game~check 2
	striptext $game~check "Ferrengi="
	if ($game~check = "True")
		setvar $game~internalferrengi true
		savevar $game~internalferrengi
	elseif ($game~check = "False")
		setvar $game~internalferrengi false
		savevar $game~internalferrengi
	end
	pause

	:game~findmaxcommands
	getword currentline $game~check 2
	striptext $game~check "Commands="
	setvar $game~max_commands $game~check
	savevar $game~max_commands
	pause

	:game~findinactive
	getword currentline $game~check 2
	striptext $game~check "Time="
	setvar $game~inactive_time $game~check
	savevar $game~inactive_time
	pause

	:game~findcoloregen
	setvar $game~line currentline
	striptext $game~line "Colonist Regen Rate="
	striptext $game~line ","
	lowercase $game~line
	replacetext $game~line "m" 000000
	replacetext $game~line "k" 000
	setvar $game~colonist_regen $game~line
	savevar $game~colonist_regen
	pause

	:game~findphotondur
	getword currentline $game~check 3
	striptext $game~check "Duration="
	setvar $game~photon_duration $game~check
	savevar $game~photon_duration
	if ($game~photon_duration <= 0)
		setvar $game~photons_enabled false
	else
		setvar $game~photons_enabled true
	end
	savevar $game~photons_enabled
	pause

	:game~finddebris
	getword currentline $game~check 3
	striptext $game~check "Percent="
	striptext $game~check "%"
	setvar $game~debris_loss $game~check
	savevar $game~debris_loss
	pause

	:game~findtradepercent
	getword currentline $game~ptradesetting 2
	striptext $game~ptradesetting "Percent="
	striptext $game~ptradesetting "%"
	savevar $game~ptradesetting
	pause

	:game~findproductionrate
	getword currentline $game~production_rate 2
	striptext $game~production_rate "Rate="
	savevar $game~production_rate
	pause

	:game~findmaxproductionrate
	getword currentline $game~production_regen 3
	striptext $game~production_regen "Regen="
	savevar $game~production_regen
	pause

	:game~findmultiplephotons
	getword currentline $game~multiple_photons 2
	striptext $game~multiple_photons "Photons="
	if ($game~multiple_photons = "True")
		setvar $game~multiple_photons true
	else
		setvar $game~multiple_photons false
	end
	savevar $game~multiple_photons
	pause

	:game~findclearbusts
	getword currentline $game~clear_bust_days 3
	striptext $game~clear_bust_days "Days="
	savevar $game~clear_bust_days
	pause

	:game~findstealfactor
	getword currentline $game~steal_factor 2
	striptext $game~steal_factor "Factor="
	striptext $game~steal_factor "%"
	setvar $game~actual_steal_factor $game~steal_factor
	savevar $game~actual_steal_factor
	savevar $game~steal_factor
	pause

	:game~findrobfactor
	getword currentline $game~rob_factor 2
	striptext $game~rob_factor "Factor="
	striptext $game~rob_factor "%"
	setvar $game~actual_rob_factor $game~rob_factor
	savevar $game~actual_rob_factor
	savevar $game~rob_factor
	pause

	:game~findportmax
	setvar $game~line currentline
	striptext $game~line "Port Production Max="
	setvar $game~port_max $game~line
	savevar $game~port_max
	pause

	:game~findradiation
	getword currentline $game~radiation_lifetime 2
	striptext $game~radiation_lifetime "Lifetime="
	savevar $game~radiation_lifetime
	pause

	:game~findlimpetremoval
	getword currentline $game~limpet_removal_cost 2
	striptext $game~limpet_removal_cost "Removal="
	striptext $game~limpet_removal_cost ","
	striptext $game~limpet_removal_cost "$"
	savevar $game~limpet_removal_cost
	setvar $game~lsd_limpremovalcost $game~limpet_removal_cost
	savevar $game~lsd_limpremovalcost
	pause

	:game~findgenesis
	getword currentline $game~genesis_cost 2
	striptext $game~genesis_cost "Torpedo="
	striptext $game~genesis_cost ","
	striptext $game~genesis_cost "$"
	savevar $game~genesis_cost
	setvar $game~lsd_gencost $game~genesis_cost
	savevar $game~lsd_gencost
	pause

	:game~findarmid
	getword currentline $game~armid_cost 2
	striptext $game~armid_cost "Mine="
	striptext $game~armid_cost ","
	striptext $game~armid_cost "$"
	savevar $game~armid_cost
	setvar $game~lsd_armidcost $game~armid_cost
	savevar $game~lsd_armidcost
	pause

	:game~findlimpet
	getword currentline $game~limpet_cost 2
	striptext $game~limpet_cost "Mine="
	striptext $game~limpet_cost ","
	striptext $game~limpet_cost "$"
	savevar $game~limpet_cost
	setvar $game~lsd_limpcost $game~limpet_cost
	savevar $game~lsd_limpcost
	pause

	:game~findbeacon
	getword currentline $game~beacon_cost 1
	striptext $game~beacon_cost "Beacon="
	striptext $game~beacon_cost ","
	striptext $game~beacon_cost "$"
	savevar $game~beacon_cost
	setvar $game~lsd_beacon $game~beacon_cost
	savevar $game~lsd_beacon
	pause

	:game~findtwarpi
	getword currentline $game~twarpi_cost 3
	striptext $game~twarpi_cost "TWarp="
	striptext $game~twarpi_cost ","
	striptext $game~twarpi_cost "$"
	savevar $game~twarpi_cost
	setvar $game~lsd_twarpicost $game~twarpi_cost
	savevar $game~lsd_twarpicost
	pause

	:game~findtwarpii
	getword currentline $game~twarpii_cost 3
	striptext $game~twarpii_cost "TWarp="
	striptext $game~twarpii_cost ","
	striptext $game~twarpii_cost "$"
	savevar $game~twarpii_cost
	setvar $game~lsd_twarpiicost $game~twarpii_cost
	savevar $game~lsd_twarpiicost
	pause

	:game~findtwarpupgrade
	getword currentline $game~twarp_upgrade_cost 2
	striptext $game~twarp_upgrade_cost "Upgrade="
	striptext $game~twarp_upgrade_cost ","
	striptext $game~twarp_upgrade_cost "$"
	savevar $game~twarp_upgrade_cost
	setvar $game~lsd_twarpupcost $game~twarp_upgrade_cost
	savevar $game~lsd_twarpupcost
	pause

	:game~findpsychic
	getword currentline $game~psychic_cost 2
	striptext $game~psychic_cost "Probe="
	striptext $game~psychic_cost ","
	striptext $game~psychic_cost "$"
	savevar $game~psychic_cost
	pause

	:game~findplanetscanner
	getword currentline $game~planet_scanner_cost 2
	striptext $game~planet_scanner_cost "Scanner="
	striptext $game~planet_scanner_cost ","
	striptext $game~planet_scanner_cost "$"
	savevar $game~planet_scanner_cost
	setvar $game~lsd_pscan $game~planet_scanner_cost
	savevar $game~lsd_pscan
	pause

	:game~findatomic
	getword currentline $game~atomic_cost 2
	striptext $game~atomic_cost "Detonator="
	striptext $game~atomic_cost ","
	striptext $game~atomic_cost "$"
	savevar $game~atomic_cost
	setvar $game~lsd_atomiccost $game~atomic_cost
	savevar $game~lsd_atomiccost
	pause

	:game~reregister
	killtrigger reregister
	gosub :getcost
	setvar $game~lsd_reregistercost $game~lsd_cost
	savevar $game~lsd_reregistercost
	pause

	:game~findcorbo
	getword currentline $game~corbo_cost 1
	striptext $game~corbo_cost "Corbomite="
	striptext $game~corbo_cost ","
	striptext $game~corbo_cost "$"
	savevar $game~corbo_cost
	setvar $game~lsd_corbocost $game~corbo_cost
	savevar $game~lsd_corbocost
	pause

	:game~findether
	getword currentline $game~probe_cost 2
	striptext $game~probe_cost "Probe="
	striptext $game~probe_cost ","
	striptext $game~probe_cost "$"
	savevar $game~probe_cost
	setvar $game~lsd_eprobe $game~probe_cost
	savevar $game~lsd_eprobe
	pause

	:game~findphoton
	getword currentline $game~photon_cost 2
	striptext $game~photon_cost "Missile="
	striptext $game~photon_cost ","
	striptext $game~photon_cost "$"
	savevar $game~photon_cost
	setvar $game~lsd_photoncost $game~photon_cost
	savevar $game~lsd_photoncost
	pause

	:game~findcloak
	getword currentline $game~cloak_cost 2
	striptext $game~cloak_cost "Device="
	striptext $game~cloak_cost ","
	striptext $game~cloak_cost "$"
	savevar $game~cloak_cost
	setvar $game~lsd_cloakcost $game~cloak_cost
	savevar $game~lsd_cloakcost
	pause

	:game~finddisruptor
	getword currentline $game~disruptor_cost 2
	striptext $game~disruptor_cost "Disruptor="
	striptext $game~disruptor_cost ","
	striptext $game~disruptor_cost "$"
	savevar $game~disruptor_cost
	setvar $game~lsd_disruptcost $game~disruptor_cost
	savevar $game~lsd_disruptcost
	pause

	:game~findholoscanner
	getword currentline $game~holo_cost 2
	striptext $game~holo_cost "Scanner="
	striptext $game~holo_cost ","
	striptext $game~holo_cost "$"
	savevar $game~holo_cost
	setvar $game~lsd_holocost $game~holo_cost
	savevar $game~lsd_holocost
	pause

	:game~finddensityscan
	getword currentline $game~density_cost 2
	striptext $game~density_cost "Scanner="
	striptext $game~density_cost ","
	striptext $game~density_cost "$"
	savevar $game~density_cost
	setvar $game~lsd_dscancost $game~density_cost
	savevar $game~lsd_dscancost
	setvar $game~fileheadings "MBBS     COLO_REGEN     PTRADE     SF     RF     PORTMAX"
	setvar $game~fileoutput $game~mbbs&"     "&$game~colonist_regen&"     "&$game~ptradesetting&"     "&$game~steal_factor&"     "&$game~rob_factor&"     "&$game~port_max
	delete $game~game_settings_file
	write $game~game_settings_file $game~fileheadings
	write $game~game_settings_file $game~fileoutput
	setvar $game~steal_factor ((30 * $game~steal_factor) / 100)
	savevar $game~steal_factor
	setvar $game~rob_factor ((3 * 100) / $game~rob_factor)
	savevar $game~rob_factor

	send "x*"

	settexttrigger prompt :allpromptscatch ""
	setdelaytrigger prompt_delay :current_prompt_delay 2000
	send "?"
	pause

	:game~current_prompt_delay
	killtrigger prompt
	goto :whistlewhileyouworksettings

	:game~allpromptscatch
	setvar $game~valid_game_menu_prompt false
	if ((currentline = "Selection (? for menu):") or (currentline = "Selection (? for menu): ") or (currentline = "Enter your choice:") or (currentline = "Enter your choice: "))
		setvar $game~valid_game_menu_prompt true
	end
	if ($game~valid_game_menu_prompt = true)
		setvar $game~game_menu_prompt currentline
		setvar $game~game_menu_prompt_ansi currentansiline
		savevar $game~game_menu_prompt
		savevar $game~game_menu_prompt_ansi
	end
	settexttrigger prompt :allpromptscatch ""
	pause

	:game~tryagainsettings
	killalltriggers
	settextlinetrigger gameclosed1 :gameclosedsettings "I'm sorry, but this is a closed game."
	settextlinetrigger gameclosed2 :gameclosedsettings "www.tradewars.com                                   Epic Interactive Strategy"
	settextlinetrigger gameclosed3 :gameclosedsettings " day(s) to get back in."
	settexttrigger phew :back_to_game "Command [TL"
	setdelaytrigger delay_close :gameclosedsettings 5000
	loadvar $bot~password
	send "T***"&$bot~password&"*    *    *    "
	pause

	:game~gameclosedsettings
	killalltriggers
	if (connected <> true)
		load "scripts\"&$bot~mombot_directory&"\commands\general\relog.cts"
		seteventtrigger relogended :relogended "SCRIPT STOPPED" "scripts\"&$bot~mombot_directory&"\commands\general\relog.cts"
		pause

		:game~relogended
		goto :tryagainsettings
	end
	setdelaytrigger whistlewhileyouworksettings :whistlewhileyouworksettings 1500
	settextlinetrigger at_game_menu :tryagainsettings "T - Play Trade Wars 2002"
	pause

	:game~whistlewhileyouworksettings
	loadvar $bot~letter
	send $bot~letter&"*"
	settexttrigger refreshpause :refreshpause "[Pause]"
	goto :gameclosedsettings

	:game~refreshpause
	send "*  "
	pause

	:game~back_to_game
	killalltriggers
	if ($game~fedspacephotons = "")

		setvar $game~fedspacephotons false
		savevar $game~fedspacephotons
	end
	send "  *  *  zaz*z*za9999*z*"

	gosub :player~quikstats
end
killtrigger settings5
if ($game~did_gamestats = true)
	setvar $game~gamestats true
else
	setvar $game~gamestats false
end
savevar $game~gamestats
return

:game~convertdelay
getword currentline $game~check1 $game~delayword
striptext $game~check1 "Delay="
if ($game~check1 = "Constant")
	getword currentline $game~check2 ($game~delayword + 1)
	striptext $game~check2 "("
	getword currentline $game~check3 ($game~delayword + 2)
	striptext $game~check3 ")"
	if ($game~check3 = "s")
		setvar $game~delay ($game~check2 * 1000)
	else
		setvar $game~delay $game~check2
	end
elseif ($game~check1 = "None")

	setvar $game~delay 0
else

	setvar $game~delay $game~check1
end
return

include "source\include\player"

:game~getcost
setvar $game~lsd_cost 0
getwordpos currentline $game~lsd_pos "="
if ($game~lsd_pos <> 0)
	cuttext currentline $game~lsd_cost ($game~lsd_pos + 1) 999
	striptext $game~lsd_cost " cr"
end
return
