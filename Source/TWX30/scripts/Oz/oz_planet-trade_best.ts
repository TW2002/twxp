	cutText CURRENTLINE $location 1 7
	striptext $location " "
	if ($location = "Citadel")
		goto :menusss
	else
		echo ANSI_12 "**NEED TO BE AT CIT PROMPT!!**"
		halt
	end
:menusss
	setVar $oz_version "OZ Planet Trader Rin version"
	setVar $menu_fuel 1
	setVar $ptrade_fuel "Buy"
	setVar $menu_organics 1
	setVar $ptrade_org "N/A"
	setVar $menu_equipment 1
	setVar $ptrade_equ "N/A"
	setVar $ptrade_min_ore 10000
	setVar $menu_grid 1
	setVar $ptrade_grid "OFF"
	setVar $ptrade_min_perc "90"
	setVar $ptrade_hag "ON"
	setVar $menu_hag 1
#new code for allowing of MegaRobs
	setVar $menuMegaRob 1
	setVar $megaRob "none"


addMenu "" "OZ-Planet Trader" "OZ-Planet Trader Settings" "." "" "Main" FALSE
addMenu "OZ-Planet Trader" "Run" "Run Script." "Z" :Menu_Run "" TRUE
addMenu "OZ-Planet Trader" "Fuel" "Fuel" "1" :Menu_fuel "" FALSE
addMenu "OZ-Planet Trader" "Organics" "Organics" "2" :Menu_organics "" FALSE
addMenu "OZ-Planet Trader" "Equipment" "Equipment" "3" :Menu_Equipment "" FALSE
addMenu "OZ-Planet Trader" "Min Port %" "Min Port %" "4" :Menu_perc "" FALSE
addMenu "OZ-Planet Trader" "Min Ore" "Min Ore" "5" :Menu_min "" FALSE
addMenu "OZ-Planet Trader" "Auto Grid" "Auto Grid" "6" :Menu_grid "" FALSE
addMenu "OZ-Planet Trader" "Haggle" "Haggle" "7" :Menu_hag "" FALSE
addMenu "OZ-Planet Trader" "Mega" "MegaRob" "8" :Menu_mega "" FALSE



setMenuHelp "Run" "This Option Activates the Responder."
setMenuHelp "Fuel" "This Option Sets the Fuel setting."
setMenuHelp "Organics" "This Option Sets the Organics setting."
setMenuHelp "Equipment" "This Option Sets the Equipment setting."
setMenuHelp "Min Port %" "This Option Sets the minimum port %."
setMenuHelp "Min Ore" "This Option Sets the Minimum Ore to Keep."
setMenuHelp "Auto Grid" "This Option toggles whether or not to grid adj"
setMenuHelp "Haggle" "This Option toggles whether or not to haggle"


:start_menu
	gosub :sub_setMenu
	gosub :ozHeader
	openMenu "OZ-Planet Trader"


:ozHeader
	ECHO ANSI_2 "*----------------------------------------*"
	ECHO ANSI_10 "          " $oz_version "       "
	ECHO ANSI_2 "*----------------------------------------*"
	return


:Menu_fuel
	add $menu_fuel 1
	if ($menu_fuel = 2)
		setVar $ptrade_fuel "N/A"
	else
		setVar $menu_fuel 1
		setVar $ptrade_fuel "Buy"
	end
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Planet Trader"

:Menu_organics
	add $menu_organics 1
	if ($menu_organics = 2)
		setVar $ptrade_org "Sell"
	elseif ($menu_organics = 3)
		setVar $ptrade_org "Sell/Buy"
	elseif ($menu_organics = 4)
		setVar $ptrade_org "Buy"
	else
		setVar $menu_organics 1
		setVar $ptrade_org "N/A"
	end
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Planet Trader"

:Menu_equipment
	add $menu_equipment 1
	if ($menu_equipment = 2)
		setVar $ptrade_equ "Sell"
	elseif ($menu_equipment = 3)
		setVar $ptrade_equ "Sell/Buy"
	elseif ($menu_equipment = 4)
		setVar $ptrade_equ "Buy"
	else
		setVar $menu_equipment 1
		setVar $ptrade_equ "N/A"
	end
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Planet Trader"

:menu_min
	getInput $ptrade_min_ore "Enter The Minimum Ore to Keep"
	echo ANSI_12 "*" $ptrade_min_ore "*"
	isNumber $number $ptrade_min_ore
		if ($number <> 1)
			echo ANSI_12 "*Invalid Number*"
			goto :Menu_min
		end
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Planet Trader"

:menu_perc
	getInput $ptrade_min_perc "Enter The Minimum Port %"
	echo ANSI_12 "*" $ptrade_min_perc "*"
	isNumber $number $ptrade_min_perc
		if ($number <> 1)
			echo ANSI_12 "*Invalid Number*"
			goto :Menu_perc
		end
		if ($ptrade_min_perc > 99) or ($ptrade_min_perc < 1)
			echo ANSI_12 "*Please enter a number between 1 and 99.*"
			goto :Menu_perc
		end
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Planet Trader"

:Menu_grid
	add $menu_grid 1
	if ($menu_grid = 2)
		setVar $ptrade_grid "ON"
	else
		setVar $menu_grid 1
		setVar $ptrade_grid "OFF"
	end
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Planet Trader"

:Menu_hag
	add $menu_hag 1
	if ($menu_hag = 2)
		setVar $ptrade_hag "OFF"
	else
		setVar $menu_hag 1
		setVar $ptrade_hag "ON"
	end
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Planet Trader"

:Menu_mega
	add $menuMegaRob 1
	if ($menuMegaRob = 2)
		echo ANSI_15 & "*This option requires ST-BOT to be running.*"
		getInput $megaRob "What is the name of the bot to do the mega rob? "
	else
		setVar $menuMegaRob 1
		setVar $megaRob "none"
	end
	gosub :sub_setMenu
	gosub :ozheader
	openMenu "OZ-Planet Trader"

:sub_setMenu
	setMenuValue "Fuel" $ptrade_fuel
	setMenuValue "Organics" $ptrade_org
	setMenuValue "Equipment" $ptrade_equ
	setMenuValue "Min Port %" $ptrade_min_perc
	setMenuValue "Min Ore" $ptrade_min_ore
	setMenuValue "Auto Grid" $ptrade_grid 
	setMenuValue "Haggle" $ptrade_hag
	setMenuValue "Mega" $megaRob
	return

:menu_run
#Start	
	send "'OZ - Planet Trader - Loading...*"
	setDelayTrigger 1stlag :recim 500
	pause
:recim
	getInput $recim "Refresh Cim (Y/N) ? "
	lowercase $recim
	if ($recim = "y")
		send "'OZ - Planet Trader - Starting Cim - Stand By...*"
		send "^rq"
		waitFor ": ENDINTERROG"
		send "'OZ - Planet Trader - Cim Complete*"
	elseif ($recim = "n")
		goto :start
	else 
		goto :recim
	end



:start
	send "qd"
	gosub :getPlanetInfo
	if ($ptrade_grid = "ON")
		send "qzn"
		gosub :get_limps
		send "l" $planet "*"
	end
	send "c"
	killAllTriggers 
	send "c;q"
	waitFor "Figs Per Attack:"
	getWord CURRENTLINE $figs 5
	gosub :figgies
:get_data
	send "*"
	waitFor "Citadel treasury contains"
	waitFor "(?="
	setDelayTrigger delay :data_wait 1000
	pause
:data_wait
	
:situate

	gosub :quikstats
	send "qd"
	gosub :getPlanetInfo
	send "c"
	if ($planetfuel <= $ptrade_min_ore)
		send "'OZ - Planet Trader - Min Ore Level Reached - Halting*"
		halt
	end
	if (($ptrade_org = "Sell") and ($planetorg < 500)) and (($ptrade_equ = "Sell") and ($planetequip < 500))
		send "'OZ - Planet Trader - Sell off Complete*"
		halt
	elseif (($ptrade_org = "Sell") and ($planetorg < 500)) and ($ptrade_equ = "N/A")
		send "'OZ - Planet Trader - Sell off Complete*"
		halt
	elseif ($ptrade_org = "N/A") and (($ptrade_equ = "Sell") and ($planetequip < 500))
		send "'OZ - Planet Trader - Sell off Complete*"
		halt
	end
:set_orders
	subtract $planetfuelmax $planetfuel
	if ($planetfuelmax >= 500)
		setVar $fuelroom 1
	else
		setVar $fuelroom 0
	end
	subtract $planetorgmax $planetorg
	if ($planetorgmax >= 500)
		setVar $orgroom 1
	else
		setVar $orgroom 0
	end
	subtract $planetequipmax $planetequip	
	if ($planetequipmax >= 500)
		setVar $equroom 1
	else
		setVar $equroom 0
	end
	if ($ptrade_grid = "ON")
		gosub :scan_adj
	end
	if ($ptrade_grid = "ON")
		goto :determine_adj
	end	
:return_adj
	setVar $source $current_sector
	setVar $breadth_mode "forward"
	gosub :breadth_search
:init_pwarp
# echo "*pwarp=" $pwarp "*"
	gosub :pwarp
	waitFor "(?="
if ($ptrade_hag = "ON")
	setVar $traded[$pwarp] 1
	setVar $_ckinc_swathoff~swathoff 1
	saveVar $_ckinc_swathoff~swathoff 
:setSellfactors
	setVar $_ck_pnego_fueltosell "-1"
	saveVar $_ck_pnego_fueltosell 
	if (($ptrade_org = "Sell") or ($ptrade_org = "Sell/Buy")) and (PORT.BUYORG[$pwarp] = 1) and ($planetorg > 500) 
		setVar $_ck_pnego_orgtosell "max"
		saveVar $_ck_pnego_orgtosell
	else
		setVar $_ck_pnego_orgtosell "-1"
		saveVar $_ck_pnego_orgtosell
	end
	if (($ptrade_equ = "Sell") or ($ptrade_equ = "Sell/Buy")) and (PORT.BUYEQUIP[$pwarp] = 1) and ($planetequip > 500) 
		setVar $_ck_pnego_equiptosell "max"
		saveVar $_ck_pnego_equiptosell
	else
		setVar $_ck_pnego_equiptosell "-1"
		saveVar $_ck_pnego_equiptosell
	end
if ($_ck_pnego_orgtosell = "max") or ($_ck_pnego_equiptosell = "max")
	load _ck_planet_nego
	setTextTrigger done_buy :done_neg "CK Planet Nego exiting"
	setDelayTrigger bad_buy :bad_neg 120000
	pause

:bad_neg
	killAllTriggers
	stop _ck_planet_nego
	send "'OZ - Planet Trader - Script Timeout - Halting Negotiate*"
	halt
end
elseif ($ptrade_hag = "OFF")
	setVar $traded[$pwarp] 1
	send "s*QQCR" & $pwarp & "*Q"
    setTextLineTrigger foundport :foundport "Items     Status  Trading % of max OnBoard"
    setTextLineTrigger noport :noport "I have no information about a port in that sector."
    setTextLineTrigger noport2 :noport "You have never visted sector"
    setTextLineTrigger noport3 :noport "credits / next hold"
    pause

:noport
        killalltriggers
        send "'No port to sell to*"
        send "l" $planet "*C"
	setVar $traded[$pwarp] 1
	goto :done_neg

:foundport
        killalltriggers
:sell
        send "PN" & $planet & "*"
	waitFor "<Negotiate Planetary TradeAgreement>"
         
          :sellproduct
            setTextTrigger sellfuel :sellfuel "How many units of Fuel Ore"
            setTextTrigger sellorg :sellorg "How many units of Organics"
            setTextTrigger sellequ :sellequ "How many units of Equipment"
	    setTextTrigger donesell :donesell "Command [TL"
            pause
            pause

            :sellfuel
                killalltriggers
                send "0*"
                goto :sellproduct
            :sellorg
                killalltriggers
		if ($ptrade_org = "Buy") or ($ptrade_org = "N/A")
	                send "0*"
        	        goto :sellproduct
		elseif ($ptrade_org = "Sell/Buy") or ($ptrade_org = "Sell")
			send "**"
			goto :sellproduct
		end
            :sellequ
                killalltriggers
		if ($ptrade_equ = "Buy") or ($ptrade_equ = "N/A")
                	send "0*"
		elseif ($ptrade_equ = "Sell/Buy") or ($ptrade_equ = "Sell")
			send "**"
			goto :sellproduct
		end
	     :donesell
		killallTriggers
		send "l" $planet "*c"


end
:done_neg
send "*"
waitFor "(?="
setVar $traded[$current_sector] 1
if ($ptrade_hag = "ON")
	killAllTriggers
	setVar $traded[$pwarp] 1
	if ($ptrade_fuel = "Buy") and (PORT.BUYFUEL[$pwarp] = 0) and ($fuelroom = 1)
		setVar $_ck_buydown_fuelrounds "max"
		setVar $_ck_buydown_fuelrounds $_ck_buydown_fuelrounds
		saveVar $_ck_buydown_fuelrounds 
	else 
		setVar $_ck_buydown_fuelrounds "-1"
		saveVar $_ck_buydown_fuelrounds 
	end
	if (($ptrade_org = "Buy") or ($ptrade_org = "Sell/Buy")) and (PORT.BUYORG[$pwarp] = 0) and ($orgroom = 1) 
		setVar $_ck_buydown_orgrounds "max"
		setVar $_ck_buydown_orgrounds $_ck_buydown_orgrounds
		saveVar $_ck_buydown_orgrounds
	else
		setVar $_ck_buydown_orgrounds "-1"
		saveVar $_ck_buydown_orgrounds
	end
	if (($ptrade_equ = "Buy") or ($ptrade_equ = "Sell/Buy")) and (PORT.BUYEQUIP[$pwarp] = 0) and ($equroom = 1) 
		setVar $_ck_buydown_equiprounds "max"
		setVar $_ck_buydown_equiprounds $_ck_buydown_equiprounds
		saveVar $_ck_buydown_equiprounds
	else
		setVar $_ck_buydown_equiprounds "-1"
		saveVar $_ck_buydown_equiprounds
	end
		setVar $_ck_buydown_mode "b"
		saveVar $_ck_buydown_mode
		
		send "cr*"
		waitFor "Equipment  "
		getWord CURRENTLINE $sellorbuy 2
		getWord CURRENTLINE $equipselling 3
		if ($sellorbuy = "Selling") AND ($equipselling > 31000) AND ($equipselling < 33000) AND ($megaRob <> "none")
			setVar $_ck_buydown_mode "w"
			saveVar $_ck_buydown_mode
		end
		send "Q"
		setDelayTrigger justWAIT :justWAIT 750
		pause
		:justWAIT

	if ($_ck_buydown_fuelrounds = "max") or ($_ck_buydown_orgrounds  = "max") or ($_ck_buydown_equiprounds = "max")
		load _ck_buydown		
		setTextTrigger done_buy :finish_buy "CK Buydown exiting"
		setDelayTrigger bad_buy :bad_buy 1000000
		pause
:bad_buy
		killAllTriggers
		stop _ck_buydown
		send "'OZ - Planet Trader - Script Timeout - Halting Buydown*"
		halt
	else
:finish_buy
	if ($megaRob <> "none") AND ($equipselling > 31000) AND ($equipselling < 33000)
		setTextLineTrigger successmega :done_buy "> - Success! -"
		setTextLineTrigger bustedmega :bustedmega "> - Busted"
		setTextLineTrigger portisshort :done_buy "> - Port is short "
		setTextLineTrigger fakebustedmega :bustedmega "> - Fake Busted"
		send "'" & $megaRob & " mega*"
		pause
	end
	goto :done_buy
	end
elseif ($ptrade_hag = "OFF")
	setVar $traded[$pwarp] 1
	send "qtnl1*tnl2*tnl3*snl1*"
	waitfor "How many groups of Colonists do you want to leave"
	gosub :getPlanetInfo
	send "c"	
	send "s*"
	gosub :getinfo
	gosub :getPortInfo
	send "q"
	setDelayTrigger initpause :initpause1 100
	pause
	:initpause1
	killAllTriggers
	setVar $_ck_buydown_mode "s"
	if ($ptrade_fuel = "Buy") and (PORT.BUYFUEL[$pwarp] = 0) and ($fuelroom = 1)
		setVar $_ck_buydown_fuelrounds "max"
	else 
		setVar $_ck_buydown_fuelrounds "-1" 
	end
	if (($ptrade_org = "Buy") or ($ptrade_org = "Sell/Buy")) and (PORT.BUYORG[$pwarp] = 0) and ($orgroom = 1) 
		setVar $_ck_buydown_orgrounds "max"
	else
		setVar $_ck_buydown_orgrounds "-1"
	end
	if (($ptrade_equ = "Buy") or ($ptrade_equ = "Sell/Buy")) and (PORT.BUYEQUIP[$pwarp] = 0) and ($equroom = 1) 
		setVar $_ck_buydown_equiprounds "max"
	else
		setVar $_ck_buydown_equiprounds "-1"
	end
	 setVar $turns_needed 0
   	 setVar $turns_allowed $turns
   	 subtract $turns_allowed 1
	 setVar $maxfueltobuy $fuelselling
    	 if ($fuelselling > $planetfuelmax)
        	setVar $maxfueltobuy $planetfuelmax
   	 end
	 setVar $maxfuelrounds $maxfueltobuy
	 divide $maxfuelrounds $holds
	setVar $maxfuelrounds $maxfuelrounds - 1
	 if ($maxfuelrounds > $turns_allowed)
        	setVar $maxfuelrounds $turns_allowed
    	 end
	 if ($_ck_buydown_fuelrounds = "-1")
            setVar $fuelrounds 0
         elseif ($_ck_buydown_fuelrounds = "max")
            setVar $fuelrounds $maxfuelrounds
	 end
	setVar $fuelrounds $fuelrounds - 1
# echo "*fuelrounds = " $fuelrounds "*"
# -=-=- orgs now
	 setVar $maxorgtobuy $orgselling
    	 if ($orgselling > $planetorgmax)
        	setVar $maxorgtobuy $planetorgmax
   	 end
	 setVar $maxorgrounds $maxorgtobuy
	 divide $maxorgrounds $holds
	 if ($maxorgrounds > $turns_allowed)
        	setVar $maxorgrounds $turns_allowed
    	 end
	 if ($_ck_buydown_orgrounds = "-1")
            setVar $orgrounds 0
         elseif ($_ck_buydown_orgrounds = "max")
            setVar $orgrounds $maxorgrounds
	 end
	setVar $orgrounds $orgrounds - 1
	 add $turns_needed $orgrounds
   	 subtract $turns_allowed $orgrounds
# echo "orgrounds = " $orgrounds "*"
# equip now
  	 setVar $maxequiptobuy $equipselling
    	 if ($equipselling > $planetequipmax)
        	setVar $maxequiptobuy $planetequipmax
   	 end
	 setVar $maxequiprounds $maxequiptobuy
	 divide $maxequiprounds $holds
	 if ($maxequiprounds > $turns_allowed)
        	setVar $maxequiprounds $turns_allowed
    	 end
	 if ($_ck_buydown_equiprounds = "-1")
            setVar $equiprounds 0
         elseif ($_ck_buydown_equiprounds = "max")
            setVar $equiprounds $maxequiprounds
	 end
	setVar $equiprounds $equiprounds - 1
	 add $turns_needed $equiprounds
   	 subtract $turns_allowed $equiprounds
# echo "*equiprounds = " $equiprounds "*"
	  setVar $buydown_mode 1
	  setVar $fuelroundsleft $fuelrounds
    	  setVar $orgroundsleft $orgrounds
    	  setVar $equiproundsleft $equiprounds
	if ($fuelrounds > 0)
    	 setVar $fuel_creds_needed $fuelrounds
   	  multiply $fuel_creds_needed $holds
    	  multiply $fuel_creds_needed 30    
	end
	if ($orgrounds > 0)
    		setVar $org_creds_needed $orgrounds
   		 multiply $org_creds_needed $holds
   		 multiply $org_creds_needed 60
    	end
	if ($equiprounds > 0)
   		 setVar $equip_creds_needed $equiprounds
   		 multiply $equip_creds_needed $holds
   		 multiply $equip_creds_needed 100
    	end
	setVar $total_creds_needed 0
	add $total_creds_needed $fuel_creds_needed
	add $total_creds_needed $org_creds_needed
	add $total_creds_needed $equip_creds_needed
	if ($total_creds_needed > $credits)
   		 setVar $cashonhand $citadelcredits
    		 add $cashonhand $credits
    		 if ($cashonhand > $total_creds_needed)
      	 	   send "C"
      	 	   send "TT" & $credits & "*"
      	 	   send "TF" & $total_creds_needed & "*"
       	 	   setVar $credits $total_creds_needed
       	 	   send "Q"
    		 else
       	 		send "'Not enough cash onhand*"
        	        halt
    		  end
	 end
	setVar $init_credits $credits
:buydownequip
    if ($equiproundsleft > 0)
        send "QPT"
        if ($fuelselling > 0)
            send "0*"
        end
        if ($orgselling > 0)
            send "0*"
        end
        gosub :buynohaggle
        send "L " & $planet & "* tnl3*"
        subtract $equiproundsleft 1
        goto :buydownequip
    end


:buydownorg
    if ($orgroundsleft > 0)
        send "QPT"
        if ($fuelselling > 0)
            send "0*"
        end
        gosub :buynohaggle
        send "L " & $planet & "* tnl2*"
        subtract $orgroundsleft 1
        goto :buydownorg
    end


:buydownfuel
    if ($fuelroundsleft > 0)
        send "QPT"
        gosub :buynohaggle
        send "L " & $planet & "* tnl1*"
        subtract $fuelroundsleft 1
        goto :buydownfuel
    end
 
:finish
echo "*landing*"
    send "l" & $planet & "*c "


end
:done_buy
	killAllTriggers
	goto :situate

:bustedmega
	send "'Busted while mega-robbing! Oz/Rin planet trader now halting.*"
	halt	

# -=-=-=-=-=-=-=-=-=- planet info =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:getPlanetInfo
killalltriggers
    send "*"
    waitFor "Planet #"
getWord CURRENTLINE $planet 2
getWord CURRENTLINE $current_sector 5
    :planetinfo
        setVar $citadel 0
        setVar $citadelcredits 0
        stripText $planet "#"
        stripText $current_sector ":"
        waitfor "2 Build 1   Product    Amount     Amount     Maximum"
	waitFor "Fuel Ore"
	getWord CURRENTLINE $planetfuel 6
            getWord CURRENTLINE $planetfuelmax 8
            stripText $planetfuel ","
            stripText $planetfuelmax ","
            waitFor "Organics"
            getWord CURRENTLINE $planetorg 5
            getWord CURRENTLINE $planetorgmax 7
            stripText $planetorg ","
            stripText $planetorgmax ","
stripText $planetorg ","
            stripText $planetorgmax ","
            waitFor "Equipment"
	getWord CURRENTLINE $planetequip 5
            getWord CURRENTLINE $planetequipmax 7
            stripText $planetequip ","
            stripText $planetequipmax ","
stripText $planetequip ","
            stripText $planetequipmax ","
            waitFor "Fighters"
	getWord CURRENTLINE $planetfig 5
            getWord CURRENTLINE $planetfigmax 7
            stripText $planetfig ","
            stripText $planetfigmax ","
            stripText $planetfig ","
            stripText $planetfigmax ","
            waitFor "Planet has a level"
getWord CURRENTLINE $citadel 5
            getWord CURRENTLINE $citadelcredits 9
            striptext $citadelcredits ","
            striptext $citadelcredits ","
            striptext $citadelcredits ","
            striptext $citadelcredits ","
            waitFor "Planet command (?=help)"            

    :planetInfoDone
        return


# -=-=-=-=-=-=-=-=-=-=- qss -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

:quikstats
	setVar $h[1] "Sect"
	setVar $h[2] "Turns"
	setVar $h[3] "Creds"
	setVar $h[4] "Figs"
	setVar $h[5] "Shlds"
	setVar $h[6] "Hlds"
	setVar $h[7] "Ore"
	setVar $h[8] "Org"
	setVar $h[9] "Equ"
	setVar $h[10] "Col" 
	setVar $h[11] "Phot"
	setVar $h[12] "Armd"
	setVar $h[13] "Lmpt"
	setVar $h[14] "GTorp"
	setVar $h[15] "TWarp"
	setVar $h[16] "Clks"
	setVar $h[17] "Beacns"
	setVar $h[18] "AtmDt"
	setVar $h[19] "Crbo"
	setVar $h[20] "EPrb"
	setVar $h[21] "MDis"
	setVar $h[22] "PsPrb"
	setVar $h[23] "PlScn"
	setVar $h[24] "LRS"
	setVar $h[25] "Aln"
	setVar $h[26] "Exp"
	setVar $h[27] "Ship"
	setVar $cnt 0
	send "/"
:chk
	setTextLineTrigger getLine :getLine
	pause

:getLine
	killtrigger done
	add $cnt 1
	setVar $culine CURRENTLINE
	replaceText $culine #179 " " & #179 & " "
	setVar $line[$cnt] $culine
	getWordPos $culine $pos " Ship "
	if ($pos > 0)
	     goto :done_read_qss
	end
	goto :chk

:done_read_qss
	killtrigger getLine
	setVar $hcount 0
:hcount
	if ($hcount < 27)
	     add $hcount 1
	     setVar $lncount 1
:lncount
	     if ($lncount < $cnt)
        	  add $lncount 1
	          getWordPos $line[$lncount] $pos $h[$hcount]
	          if ($pos > 0)
	               setVar $work $line[$lncount]
	               cutText $work $work $pos 9999
	               upperCase $h[$hcount]
	               getWord $work $quikstats[$h[$hcount]] 2
	               stripText $quikstats[$h[$hcount]] ","
	          else
	               goto :lncount
	          end
	     end
	     goto :hcount
	end
return

# -=-=-=-=-=-=-=-=-=-=- fig refresh -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
:figgies
:get_da_figs
	send "'OZ - Planet Trader - Loading Figs*"
	setVar $figfile "_ck_" & GAMENAME & ".figs"
	fileExists $exists $figfile
	if ($exists = 0)
		setVar $nofile 1
		send "'OZ - Planet Trader - No fig data found - Halting"
		halt
	end
	setVar $read_count 0
	setVar $merge_count 1
:read_fig_array
	add $read_count 1
	read $figfile $read[$read_count] $read_count
	if ($read[$read_count] = "EOF")
		goto :done_read_fig_array
	end
	if ($read_count > 1)
		mergeText $read[1] $read[$read_count] $read[1]
	end
	goto :read_fig_array

:done_read_fig_array
:set_fig_array
	setArray $figlist SECTORS
	setVar $fig_array_count 0
:make_array
	add $fig_array_count 1
	if ($fig_array_count > SECTORS)
		goto :done_fig_array
	end
	getWord $read[1] $fig_check $fig_array_count
	if ($fig_check <> 0)
		setVar $figlist[$fig_array_count] 1
	end
	goto :make_array

:done_fig_array
	send "'OZ - Planet Trader - Fig Array Complete*"
	return
	
# -=-=-=-=-=-=-=-=-=-=- breadth search -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:breadth_search
    # (var $source should be passed from main)
    # (var $breadth_mode should be passed from main)
    # (var $near should be passed from main)
    setVar $database[1] $source
    setVar $array_size 1
    setVar $array_pos 0
    setVar $num_sectors SECTORS
    setArray $checked $num_sectors
    setVar $checked[$source] 1
    setArray $path $num_sectors
    setVar $path[$source] ""
    setArray $distance $num_sectors
    setVar $distance[$source] 0

    :SectorLoop
        add $array_pos 1
        if ($array_pos > $array_size)
            send "'OZ - Planet Trader - No more ports on CIM*"
		halt
        end
        setVar $current_sector $database[$array_pos]
        setVar $warpnum 0
        :checkwarps
            add $warpnum 1
            if ($breadth_mode = "reverse")
                setVar $target SECTOR.WARPSIN[$current_sector][$warpnum]
            else
                setVar $target SECTOR.WARPS[$current_sector][$warpnum]
            end
	    if ($target = "") or ($target = 0)
			send "'OZ - Trade Route - Search Complete*"
			halt
	    end
            if ($checked[$target] = 0)
                setVar $checked[$target] 1
                add $array_size 1
                setVar $database[$array_size] $target

                if ($breadth_mode = "reverse")
                    setVar $path[$target] $path[$current_sector] & " " & $target
                else
                    setVar $path[$target] $target & " " & $path[$current_sector]
                end

                setVar $distance[$target] $distance[$current_sector]
                add $distance[$target] 1

                if ($distance[$target] > 20)
                    setVar $return_data "Distance over 20 hops, halting request"
                    return
                end

# new trade route info
		if (PORT.BUYORG[$target] = 1) and ($traded[$target] <> 1) and ($figlist[$target] = 1) and (PORT.PERCENTORG[$target] > $ptrade_min_perc) and ($planetorg > 500) and (($ptrade_org = "Sell") or ($ptrade_org = "Sell/Buy"))
			 setVar $pwarp $target	
			 return
		elseif (PORT.BUYORG[$target] = 0) and ($traded[$target] <> 1) and ($figlist[$target] = 1) and (PORT.PERCENTORG[$target] > $ptrade_min_perc) and ($orgroom = 1) and (($ptrade_org = "Buy") or ($ptrade_org = "Sell/Buy"))
			 setVar $pwarp $target	
			 return
		elseif (PORT.BUYEQUIP[$target] = 1) and ($traded[$target] <> 1) and ($figlist[$target] = 1) and (PORT.PERCENTEQUIP[$target] > $ptrade_min_perc) and ($planetequip > 500) and (($ptrade_equ = "Sell") or ($ptrade_equ = "Sell/Buy"))
			 setVar $pwarp $target	
			 return
		elseif (PORT.BUYEQUIP[$target] = 0) and ($traded[$target] <> 1) and ($figlist[$target] = 1) and ($equroom = 1) and (PORT.PERCENTEQUIP[$target] > $ptrade_min_perc) and (($ptrade_equ = "Buy") or ($ptrade_equ = "Sell/Buy"))
			 setVar $pwarp $target	
			return
                end

            end
            if ($array_size = $num_sectors)
                send "'OZ - Trade Route - No more ports on CIM*"
		halt
            end
            if ($breadth_mode = "reverse")
                if ($warpnum < SECTOR.WARPINCOUNT[$current_sector])
                    goto :checkwarps
                end
            else
                if ($warpnum < SECTOR.WARPCOUNT[$current_sector])
                    goto :checkwarps
                end
            end
            goto :SectorLoop



# -=-=-=-=-=-=-=- pwarpy -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:pwarp
	killAllTriggers
	if ($pwarp = "") or ($pwarp = 0)
		send "'OZ - Trade Route - Search Complete*"
		halt
	elseif ($pwarp = $current_sector)
		send "'OZ - Trade Route - Search Complete*"
		halt
	end
	send "p" $pwarp "*y"
	setTextLineTrigger pwarp_lock :pwarp_lock "Locating beam pinpointed"
	setTextLineTrigger no_pwarp_lock :no_pwarp_lock "Your own fighters must be"
	setTextLineTrigger already :already "You are already in that sector!"
	setTextLineTrigger no_ore :no_ore "You do not have enough Fuel Ore"
	pause

:no_pwarp_lock
	killAllTriggers
	setVar $figlist[$pwarp] 0
	goto :situate

:no_ore
	killAllTriggers
	send "'OZ - Planet Trader - Not enough Planet Ore - Halting*"
	halt

:pwarp_lock
	killAllTriggers
	waitFor "Planet is now in sector"
:already
	killAllTriggers
	return

# -=-=-=-=-=-=-=-=- scan adj -=-=-=-=-=-=-=-=-=-=-
:scan_adj
	send "qq  zn  sdshznl" $planet "*c"
	waitFor "Long Range Scan"
	waitFor "<Enter Citadel>"
	waitFor "Citadel command"
	return
	
# -=-=-=- limp array -=-=-=-=-=--=-
:get_limps
	send "k2"
	setArray $limps SECTORS
	waitFor "============="
:limp_trigger
	setTextLineTrigger limpets :limpets
	pause
	
:limpets
	getWord CURRENTLINE $limpy 1
	getWord CURRENTLINE $nolimps 2
	stripText $limpy ","
	if ($nolimps = "Active") or ($nolimps = "Limpet")
		killAllTriggers
		return
	end
	isNumber $number $limpy
	if ($number = 1) and ($limpy > 0)
		setVar $limps[$limpy] 1
	end
	goto :limp_trigger

# -=-=-=-=-=-=- determine adj -=-=-=-=-=-=-=-=-
:determine_adj
	setVar $adj_count 0
:add_in_adj
	add $adj_count 1
	setVar $adjsec SECTOR.WARPS[$current_sector][$adj_count]
	if ($adj_count > SECTOR.WARPCOUNT[$current_sector])
		goto :return_adj
	end
	if (SECTOR.FIGS.QUANTITY[$adjsec] <> 0)
		goto :add_in_adj
	end
	getSector $adjsec $secinfo
	if ($secinfo.port.exists = 0)
		goto :add_in_adj
	end
	send "cr" $adjsec "*f" $adjsec "*" $current_sector "*q"
	waitFor "<Computer deactivated>"
	waitFor "Citadel command"	
	getDistance $dist $adjsec $current_sector
	if ($secinfo.anomoly = "YES") and ($limps[$adjsec] = 0)
		goto :add_in_adj
	end
	if (SECTOR.PLANETCOUNT[$adjsec] = 0) and (SECTOR.TRADERCOUNT[$adjsec] = 0) and ($dist = 1) and ($adjsec > 10) and ($adjsec <> STARDOCK)
		setVar $boomsec $adjsec
	else
		goto :add_in_adj
	end
:check_port_adj
	if (PORT.BUYORG[$boomsec] = 1) and ($planetorg > 500) and (PORT.PERCENTORG[$boomsec] > $ptrade_min_perc) and (($ptrade_org = "Sell") or ($ptrade_org = "Sell/Buy"))
		goto :move_boomsec
	elseif (PORT.BUYORG[$boomsec] = 0) and ($orgroom = 1) and (PORT.PERCENTORG[$boomsec] > $ptrade_min_perc) and (($ptrade_org = "Buy") or ($ptrade_org = "Sell/Buy"))
		goto :move_boomsec
	elseif (PORT.BUYEQUIP[$boomsec] = 1) and ($planetequip > 500) and (PORT.PERCENTEQUIP[$boomsec] > $ptrade_min_perc) and (($ptrade_equ = "Sell") or ($ptrade_equ = "Sell/Buy"))
		goto :move_boomsec	
	elseif (PORT.BUYEQUIP[$boomsec] = 0) and ($equroom = 1) and (PORT.PERCENTEQUIP[$boomsec] > $ptrade_min_perc) and (($ptrade_equ = "Buy") or ($ptrade_equ = "Sell/Buy"))
		goto :move_boomsec	
	else
		goto :add_in_adj
	end 

:move_boomsec
	send "'Figging - " $boomsec "*"
	send "qqzn  m" $boomsec "*  *  za" & $figs & "*z  n  f  z  1*  z  c  d  z  n  <  z  n  l  " $planet "*  mnt*  c"
	waitFor "<Enter Citadel>"
	setVar $pwarp $boomsec
	goto :init_pwarp


# ----- SUB :getInfo
:getInfo
    setVar $photons 0
    setVar $scan_type "None"
    setVar $twarp_type 0
    setVar $corpstring "[0]"
    send "I"
    waitfor "<Info>"
    :waitForInfo
        setTextLineTrigger getTraderName :getTraderName "Trader Name    :"
        setTextLineTrigger getExpAndAlign :getExpAndAlign "Rank and Exp"
        setTextLineTrigger getCorp :getCorp "Corp           #"
        setTextLineTrigger getShipType :getShipType "Ship Info      :"
        setTextLineTrigger getTPW :getTPW "Turns to Warp  :"
        setTextLineTrigger getSect :getSect "Current Sector :"
        setTextLineTrigger getTurns :getTurns "Turns left"
        setTextLineTrigger getHolds :getHolds "Total Holds"
        setTextLineTrigger getFighters :getFighters "Fighters       :"
        setTextLineTrigger getShields :getShields "Shield points  :"
        setTextLineTrigger getPhotons :getPhotons "Photon Missiles:"
        setTextLineTrigger getScanType :getScanType "LongRange Scan :"
        setTextLineTrigger getTwarpType1 :getTwarpType1 "  (Type 1 Jump):"
        setTextLineTrigger getTwarpType2 :getTwarpType2 "  (Type 2 Jump):"
        setTextLineTrigger getCredits :getCredits "Credits"
        setTextTrigger getInfoDone :getInfoDone "Command [TL="
        setTextTrigger getInfoDone2 :getInfoDone "Citadel command"
        pause
        pause
    :getTraderName
        killAllTriggers
        setVar $tradername CURRENTLINE
        stripText $tradername "Trader Name    : "
        stripText $tradername "3rd Class "
        stripText $tradername "2nd Class "
        stripText $tradername "1st Class "
        stripText $tradername "Nuisance "
        stripText $tradername "Menace "
        stripText $tradername "Smuggler Savant "
        stripText $tradername "Smuggler "
        stripText $tradername "Robber "
        stripText $tradername "Private "
        stripText $tradername "Lance Corporal "
        stripText $tradername "Corporal "
        stripText $tradername "Staff Sergeant "
        stripText $tradername "Gunnery Sergeant "
        stripText $tradername "1st Sergeant "
        stripText $tradername "Sergeant Major "
        stripText $tradername "Sergeant "
        stripText $tradername "Chief Warrant Officer "
        stripText $tradername "Warrant Officer "
        stripText $tradername "Terrorist "
        stripText $tradername "Infamous Pirate "
        stripText $tradername "Notorious Pirate "
        stripText $tradername "Dread Pirate "
        stripText $tradername "Pirate "
        stripText $tradername "Galactic Scourge "
        stripText $tradername "Enemy of the State "
        stripText $tradername "Enemy of the People "
        stripText $tradername "Enemy of Humankind "
        stripText $tradername "Heinous Overlord "
        stripText $tradername "Prime Evil "
        stripText $tradername "Ensign "
        stripText $tradername "Lieutenant J.G. "
        stripText $tradername "Lieutenant Commander "
        stripText $tradername "Lieutenant "
        stripText $tradername "Commander "
        stripText $tradername "Captain "
        stripText $tradername "Commodore "
        stripText $tradername "Rear Admiral "
        stripText $tradername "Vice Admiral "
        stripText $tradername "Fleet Admiral "
        stripText $tradername "Admiral "
        stripText $tradername "Civilian "
        stripText $tradername "Annoyance "
        goto :waitForInfo
    :getExpAndAlign
        killAllTriggers
        getWord CURRENTLINE $exp 5
        getWord CURRENTLINE $align 7
        stripText $exp ","
        stripText $align ","
        stripText $align "Alignment="
        goto :waitForInfo
    :getCorp
        killAllTriggers
        getWord CURRENTLINE $corp 3
        stripText $corp ","
        setVar $corpstring "[" & $corp & "]"
        goto :waitForInfo
    :getShipType
        killAllTriggers
        getWordPos CURRENTLINE $shiptypeend "Ported="
        subtract $shiptypeend 18
        cutText CURRENTLINE $shiptype 18 $shiptypeend
        goto :waitForInfo
    :getTPW
        killAllTriggers
        getWord CURRENTLINE $tpw 5
        goto :waitForInfo
    :getSect
        killAllTriggers
        getWord CURRENTLINE $current_sector 4
        goto :waitForInfo
    :getTurns
        killAllTriggers
        getWord CURRENTLINE $turns 4
        if ($turns = "Unlimited")
            setVar $turns 65000
        end
        goto :waitForInfo
    :getHolds
        killAllTriggers
        setVar $line CURRENTLINE
        getWord $line $holds 4
        getWordPos $line $textpos "Ore="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $oreholds 1
            stripText $oreholds "Ore="
        else
            setVar $oreholds 0
        end
        getWordPos $line $textpos "Organics="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $orgholds 1
            stripText $orgholds "Organics="
        else
            setVar $orgholds 0
        end
        getWordPos $line $textpos "Equipment="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $equholds 1
            stripText $equholds "Equipment="
        else
            setVar $equholds 0
        end
        getWordPos $line $textpos "Colonists="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $coloholds 1
            stripText $coloholds "Colonists="
        else
            setVar $coloholds 0
        end
        getWordPos $line $textpos "Empty="
        if ($textpos <> 0)
            cutText CURRENTLINE $temp $textpos 100
            getWord $temp $emptyholds 1
            stripText $emptyholds "Empty="
        else
            setVar $emptyholds 0
        end
        goto :waitForInfo
    :getFighters
        killAllTriggers
        getWord CURRENTLINE $figs 3
        stripText $figs ","
        goto :waitForInfo
    :getShields
        killAllTriggers
        getWord CURRENTLINE $shields 4
        stripText $shields ","
        goto :waitForInfo
    :getPhotons
        killAllTriggers
        getWord CURRENTLINE $photons 3
        goto :waitForInfo
    :getScanType
        killAllTriggers
        getWord CURRENTLINE $scan_type 4
        goto :waitForInfo
    :getTwarpType1
        killAllTriggers
        getWord CURRENTLINE $twarp_1_range 4
        setVar $twarp_type 1
        goto :waitForInfo
    :getTwarpType2
        killAllTriggers
        getWord CURRENTLINE $twarp_2_range 4
        setVar $twarp_type 2
        goto :waitForInfo
    :getCredits
        killAllTriggers
        getWord CURRENTLINE $credits 3
        stripText $credits ","
        goto :waitForInfo
    :getInfoDone
        killalltriggers
        return

# ----- SUB :getPortInfo -----
:getPortInfo
    send "S*CR*Q"
    setTextLineTrigger foundport :foundport2 "Items     Status  Trading % of max OnBoard"
    setTextLineTrigger noport :noport2 "I have no information about a port in that sector."
    setTextLineTrigger noport2 :noport2 "You have never visted sector"
    setTextLineTrigger noport3 :noport2 "credits / next hold"
    pause

    :noport2


    :foundport2
        killalltriggers
        setVar $fuelselling 0
        setVar $orgselling 0
        setVar $equipselling 0

        :getselling
            setTextLineTrigger portfuelinfo :portfuelinfo "Fuel Ore   Selling"
            setTextLineTrigger portorginfo :portorginfo "Organics   Selling"
            setTextLineTrigger portequipinfo :portequipinfo "Equipment  Selling"
            setTextLineTrigger gotallportinfo :gotallportinfo "<Computer deactivated>"
            pause

        :portfuelinfo
            killalltriggers
            getWord CURRENTLINE $fuelselling 4
            goto :getselling

        :portorginfo
            killalltriggers
            getWord CURRENTLINE $orgselling 3
            goto :getselling

        :portequipinfo
            killalltriggers
            getWord CURRENTLINE $equipselling 3
            goto :getselling

        :gotallportinfo
            killalltriggers
# echo "*returning from port info*"
            return


# ----- SUB :buynohaggle
:buynohaggle

    send "**"
    add $cyclebuffer 1
    if ($cyclebuffer = $cyclebufferlimit)
        setVar $cyclebuffer 1
        send "/"
        waitfor " Sect "
    end
    return

