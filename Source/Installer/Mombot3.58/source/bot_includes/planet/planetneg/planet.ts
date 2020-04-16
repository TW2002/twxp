# ============================== START PLANET NEGOTIATION =======================
:planetNeg
# CREDITS
# -------
# Written by Cherokee



# ----- INIT VARS -----
setVar $output_file  $bot~mcic_file
setVar $selldelay 0
setVar $oreMCIC "-90"
setVar $orgMCIC "-75"
setVar $equMCIC "-65"
setVar $version "3.0.0"
	
setVar $startingLocation $PLAYER~current_prompt
:verifyprompt
	if (($startingLocation <> "Citadel") and ($startingLocation <> "Planet"))
		setVar $exit_message "Must start at Citadel or Planet Prompt for Planet Nego"
		goto :exitneg
	end


# ----- PTRADE SETTING-----
setVar $_ck_ptradesetting $GAME~ptradesetting

if ($startingLocation = "Citadel")
	send "Q"
elseif ($startingLocation = "Planet ")
	setVar $startingLocation "Planet"
end
gosub :getPlanetInfo
send "Q"
gosub :PLAYER~getInfo
send "*"


send "|CR" & $PLAYER~current_sector & "*Q|"

setTextLineTrigger foundport :foundport "Items     Status  Trading % of max OnBoard"
setTextLineTrigger noport :noport "I have no information about a port in that sector."
setTextLineTrigger noport2 :noport "You have never visted sector"
setTextLineTrigger noport3 :noport "credits / next hold"
pause

:noport
	killtrigger foundport
	killtrigger noport
	killtrigger noport2
	killtrigger noport3
	gosub :negotiateLand
	setVar $exit_message "No port to sell to"
	goto :exitneg

:foundport
	killtrigger foundport
	killtrigger noport
	killtrigger noport2
	killtrigger noport3
	setTextLineTrigger portinfo1 :portinfo1 "Fuel Ore "
	setTextLineTrigger portinfo2 :portinfo2 "Organics"
	setTextLineTrigger portinfo3 :portinfo3 "Equipment"
	setTextLineTrigger gotCR :gotCR "Computer command [TL="
	pause

	:portinfo1
		killtrigger portinfo1
		killtrigger portinfo2
		killtrigger portinfo3
		killtrigger gotCR
		getWord CURRENTLINE $PLAYER~current_sector.orebuying 3
		getWord CURRENTLINE $PLAYER~current_sector.oretrading 4
		getWord CURRENTLINE $PLAYER~current_sector.orepercent 5
		striptext $PLAYER~current_sector.orepercent "%"
		goto :foundport
	:portinfo2
		killtrigger portinfo1
		killtrigger portinfo2
		killtrigger portinfo3
		killtrigger gotCR
		getWord CURRENTLINE $PLAYER~current_sector.orgbuying 2
		getWord CURRENTLINE $PLAYER~current_sector.orgtrading 3
		getWord CURRENTLINE $PLAYER~current_sector.orgpercent 4
		striptext $PLAYER~current_sector.orgpercent "%"
		goto :foundport
	:portinfo3
		killtrigger portinfo1
		killtrigger portinfo2
		killtrigger portinfo3
		killtrigger gotCR
		getWord CURRENTLINE $PLAYER~current_sector.equbuying 2
		getWord CURRENTLINE $PLAYER~current_sector.equtrading 3
		getWord CURRENTLINE $PLAYER~current_sector.equpercent 4
		striptext $PLAYER~current_sector.equpercent "%"
		goto :foundport
	:gotCR
		killtrigger portinfo1
		killtrigger portinfo2
		killtrigger portinfo3
		killtrigger gotCR


setDelayTrigger justasec :justasec 500
pause
:justasec


:initinfo
	if ($PLAYER~turns <= 0)
		gosub :negotiateLand
		setVar $exit_message "I have no turns to negotiate this planet"
		goto :exitneg
	end
	if ($PLAYER~credits > 900000000)
		gosub :negotiateLand
		setVar $exit_message "I have too much cash on hand"
		goto :exitneg
	end

	if ($_ck_pnego_fueltosell = "-1")
		setVar $fueltosell 0
	elseif ($_ck_pnego_fueltosell = "max")
		setVar $fueltosell $planetorg
	else
		setvar $fueltosell $_ck_pnego_fueltosell
	end

	if ($fueltosell > $planetfuel)
		setVar $fueltosell $planetfuel
	end

	if ($_ck_pnego_orgtosell = "-1")
		setVar $orgtosell 0
	elseif ($_ck_pnego_orgtosell = "max")
		setVar $orgtosell $planetorg
	else
		setvar $orgtosell $_ck_pnego_orgtosell
	end

	if ($orgtosell > $planetorg)
		setVar $orgtosell $planetorg
	end

	if ($_ck_pnego_equiptosell = "-1")
		setVar $equiptosell 0
	elseif ($_ck_pnego_equiptosell = "max")
		setVar $equiptosell $planetequip
	else
		setvar $equiptosell $_ck_pnego_equiptosell
	end

	if ($equiptosell > $planetequip)
		setVar $equiptosell $planetequip
	end


			# determine if the sale can proceed, based on units desired to sell and what port is buying
			if (($PLAYER~current_sector.orebuying <> "Buying") or ($PLAYER~current_sector.orepercent < 15))
				setVar $fueltosell 0
			end
			if (($PLAYER~current_sector.orgbuying <> "Buying") or ($PLAYER~current_sector.orgpercent < 15))
				setVar $orgtosell 0
			end
			if (($PLAYER~current_sector.equbuying <> "Buying") or ($PLAYER~current_sector.equpercent < 15))
				setVar $equiptosell 0
			end


:selloff
	if (($fueltosell <> 0) or ($orgtosell <> 0) or ($equiptosell <> 0))
		setVar $ore_sell_failures 0
		setVar $org_sell_failures 0
		setVar $equ_sell_failures 0
		setVar $oreselloutput ""
		setVar $orgselloutput ""
		setVar $equselloutput ""
		setVar $oreprofit 0
		setVar $orgprofit 0
		setVar $equprofit 0
		# turning comms off
		send "|"
		gosub :sell
		gosub :negotiateLand
		if ($startingLocation = "Citadel")
			# deposit profits in treasury
			if ($oreprofit <> 0)
				send "TT" & $oreprofit & "*"
				subtract $PLAYER~credits $oreprofit
			end
			if ($orgprofit <> 0)
				send "TT" & $orgprofit & "*"
				subtract $PLAYER~credits $orgprofit
			end
			if ($equprofit <> 0)
				send "TT" & $equprofit & "*"
				subtract $PLAYER~credits $equprofit
			end
		end

		# turning comms back on
		send "|"


		# send script output

		setVar $generalOutput "*Sector " & $PLAYER~CURRENT_SECTOR  & "*"
		write $output_file $generalOutput

		if ($oreselloutput <> "")
			#send $oreselloutput
			setVar $SWITCHBOARD~message "  *"&$oreselloutput
			if ($SWITCHBOARD~self_command <> TRUE)
				setVar $SWITCHBOARD~self_command 2
			end
			gosub :SWITCHBOARD~switchboard

			write $output_file $oreselloutput
		end
		if ($orgselloutput <> "")
			#send $orgselloutput
			setVar $SWITCHBOARD~message "  *"&$orgselloutput
			if ($SWITCHBOARD~self_command <> TRUE)
				setVar $SWITCHBOARD~self_command 2
			end
			gosub :SWITCHBOARD~switchboard
			write $output_file $orgselloutput
		end
		if ($equselloutput <> "")
			#send $equselloutput
			setVar $SWITCHBOARD~message "  *"&$equselloutput
			if ($SWITCHBOARD~self_command <> TRUE)
				setVar $SWITCHBOARD~self_command 2
			end
			gosub :SWITCHBOARD~switchboard
			write $output_file $equselloutput
		end
		setVar $exit_message "Done with port"
		goto :exitneg
	else
		gosub :negotiateLand
		setVar $exit_message "Nothing to sell"
		goto :exitneg
	end





:sell
	:resell
		if ($PLAYER~turns <= 0)
			send "'I'm out of turns*"
			return
		end
		setVar $thisorefailed 0
		setVar $thisorgfailed 0
		setVar $thisequfailed 0
		send "PN" & $planet & "*"
		subtract $PLAYER~turns 1
			:getpercts
				setTextLineTrigger orepct :orepct "Fuel Ore   Buying"
				setTextLineTrigger orgpct :orgpct "Organics   Buying"
				setTextLineTrigger equpct :equpct "Equipment  Buying"
				setTextLineTrigger gotpercts :gotpercts "Registry# and Planet Name"
				pause

				:orepct
					killtrigger orepct
					killtrigger orgpct
					killtrigger equpct
					killtrigger gotpercts
					getWord CURRENTLINE $PLAYER~current_sector.oretrading 4
					getWord CURRENTLINE $PLAYER~current_sector.orepercent 5
					striptext $PLAYER~current_sector.orepercent "%"
					if ($PLAYER~current_sector.orepercent < 100)
						add $PLAYER~current_sector.orepercent 1
					end
					goto :getpercts

				:orgpct
					killtrigger orepct
					killtrigger orgpct
					killtrigger equpct
					killtrigger gotpercts
					getWord CURRENTLINE $PLAYER~current_sector.orgtrading 3
					getWord CURRENTLINE $PLAYER~current_sector.orgpercent 4
					striptext $PLAYER~current_sector.orgpercent "%"
					if ($PLAYER~current_sector.orgpercent < 100)
						add $PLAYER~current_sector.orgpercent 1
					end
					goto :getpercts

				:equpct
					killtrigger orepct
					killtrigger orgpct
					killtrigger equpct
					killtrigger gotpercts
					getWord CURRENTLINE $PLAYER~current_sector.equtrading 3
					getWord CURRENTLINE $PLAYER~current_sector.equpercent 4
					striptext $PLAYER~current_sector.equpercent "%"
					if ($PLAYER~current_sector.equpercent < 100)
						add $PLAYER~current_sector.equpercent 1
					end
					goto :getpercts

				:gotpercts
					killtrigger orepct
					killtrigger orgpct
					killtrigger equpct
					killtrigger gotpercts

			:sellproduct
				setTextTrigger sellfuel :sellfuel "How many units of Fuel Ore"
				setTextTrigger sellorg :sellorg "How many units of Organics"
				setTextTrigger sellequ :sellequ "How many units of Equipment"
				setTextTrigger donewithport :donewithport "Command [TL="
				pause

			:sellfuel
				killtrigger sellfuel
				killtrigger sellorg
				killtrigger sellequ
				killtrigger donewithport
				if (($PLAYER~current_sector.orepercent >= 15) and ($fueltosell > 0))
					if ($fueltosell > $PLAYER~current_sector.oretrading)
						setVar $fueltosell $PLAYER~current_sector.oretrading
					end
					setVar $prodtosell "ore"
					setVar $portbuying $fueltosell
					gosub :sellhaggle
					if ($currenthaggle = "succeeded")
						setVar $orehaggle "succeeded"
						setVar $fueltosell 0
						subtract $oreMCIC 1
					else
						setVar $orehaggle "failed"
					end
				else
					send "0*"
				end
				goto :sellproduct

			:sellorg
				killtrigger sellfuel
				killtrigger sellorg
				killtrigger sellequ
				killtrigger donewithport
				if (($PLAYER~current_sector.orgpercent >= 15) and ($orgtosell > 0))
					if ($orgtosell > $PLAYER~current_sector.orgtrading)
						setVar $orgtosell $PLAYER~current_sector.orgtrading
					end
					setVar $prodtosell "org"
					setVar $portbuying $orgtosell
					gosub :sellhaggle
					if ($currenthaggle = "succeeded")
						setVar $orghaggle "succeeded"
						setVar $orgtosell 0
						subtract $orgMCIC 1
					else
						setVar $orghaggle "failed"
					end
				else
					send "0*"
				end
				goto :sellproduct

			:sellequ
				killtrigger sellfuel
				killtrigger sellorg
				killtrigger sellequ
				killtrigger donewithport
				if (($PLAYER~current_sector.equpercent >= 15) and ($equiptosell > 0))
					if ($equiptosell > $PLAYER~current_sector.equtrading)
						setVar $equiptosell $PLAYER~current_sector.equtrading
					end
					setVar $prodtosell "equ"
					setVar $portbuying $equiptosell
					gosub :sellhaggle
					if ($currenthaggle = "succeeded")
						setVar $equhaggle "succeeded"
						setVar $equiptosell 0
						subtract $equMCIC 1
					else
						setVar $equhaggle "failed"
					end
				else
					send "0*"
				end
				goto :sellproduct

			:donewithport
				killtrigger sellfuel
				killtrigger sellorg
				killtrigger sellequ
				killtrigger donewithport
				if (($ore_sell_failures > 1) or ($org_sell_failures > 4) or ($equ_sell_failures > 4))
					setVar $selloutput $selloutput & "Multiple Haggle Failures - Please cut and paste this haggling session and email to Cherokee*"
					return
				elseif (($fueltosell = 0) and ($orgtosell = 0) and ($equiptosell = 0))
					setvar $exit_message "Nothing to sell here!"
					return
				else
					goto :resell
				end




:sellhaggle
	setTextLineTrigger sellfirstoffer :sellfirstoffer "We'll buy them for"
	send $portbuying & "*"
	pause

	:sellfirstoffer
		killtrigger sellfirstoffer
		getWord CURRENTLINE $offer 5
		striptext $offer ","

		gosub :PLAYER~swathoff
		if ($PLAYER~swathoff = FALSE)
			gosub :negotiateLand
			setVar $exit_message $swathOffMessage
			goto :exitneg
		end


		# ----- CALCULATE the port's "quality" -----
		setVar $perunitinitoffer $offer

		#NEW CODE ADDED TO SUPPORT NON-100% PTRADES
		multiply $perunitinitoffer 100
		divide $perunitinitoffer $_ck_ptradesetting

		# multiply by 100 to increase accuracy of results, we'll need to divide by 100 later
		multiply $perunitinitoffer 100

		# divide by the number of units you are selling
		divide $perunitinitoffer $portbuying

		#initialize portmaxinit
		setVar $portmaxinit $perunitinitoffer

		# return to 10 scale
		divide $perunitinitoffer 10

		if ($prodtosell = "ore")
			# port max init  =(($perunitinitoffer-25.60558)/($percent-11.7248))*(88.2752)+25.60558
			setVar $basevalue 256055800
			setVar $basepercent 11725
			setVar $basepercentinverse 88275
			setVar $percentfrombase $PLAYER~current_sector.orepercent
		elseif ($prodtosell = "org")
			# port max init  =(($perunitinitoffer-50.62764)/($percent-11.28715))*(88.71285)+50.62764
			setVar $basevalue 506276400
			setVar $basepercent 11287
			setVar $basepercentinverse 88713
			setVar $percentfrombase $PLAYER~current_sector.orgpercent
		elseif ($prodtosell = "equ")
			# port max init  =(($perunitinitoffer-90.6281)/($percent-10.98921))*(89.01079)+90.6281
			setVar $basevalue 906281000
			setVar $basepercent 10989
			setVar $basepercentinverse 89010
			setVar $percentfrombase $PLAYER~current_sector.equpercent
		end

		if ($percentfrombase = 100)
			#echo "* 100% port*"
			# return to 10 scale
			divide $portmaxinit 10

		elseif ($percentfrombase >= 15)
			# multiply by 100,000 for precision
			multiply $portmaxinit 100000

			# subtract basevalue (in 10,000,000 scale)
			subtract $portmaxinit $basevalue

			# multiply by 1000 for precision
			multiply $percentfrombase 1000

			# subtract equ base percent (1,000 scale)
			subtract $percentfrombase $basepercent

			# calculate PMI/PFB
			divide $portmaxinit $percentfrombase

			# multiply by inverse of equ base percent (1,000 scale)
			multiply $portmaxinit $basepercentinverse

			# add the basevalue (in 10,000,000 scale)
			add $portmaxinit $basevalue

			# return to 10 scale
			divide $portmaxinit 1000000

		elseif ($prodtosell = "ore")
			setVar $portmaxinit 340

		elseif ($prodtosell = "org")
			setVar $portmaxinit 635

		elseif ($prodtosell = "equ")
			setVar $portmaxinit 1063
		end



		# ----- LOOKUP the counteroffer percentage to use at this "quality" port -----

		if ($prodtosell = "ore")
			if ($portmaxinit >= 436)
				setVar $MCIC "-90"
				setVar $multiple "1494"

			elseif ($portmaxinit >= 434)
				setVar $MCIC "-89"
				setVar $multiple "1488"

			elseif ($portmaxinit >= 433)
				setVar $MCIC "-88"
				setVar $multiple "1482"

			elseif ($portmaxinit >= 431)
				setVar $MCIC "-87"
				setVar $multiple "1476"

			elseif ($portmaxinit >= 429)
				setVar $MCIC "-86"
				setVar $multiple "1470"

			elseif ($portmaxinit >= 427)
				setVar $MCIC "-85"
				setVar $multiple "1464"

			elseif ($portmaxinit >= 425)
				setVar $MCIC "-84"
				setVar $multiple "1458"

			elseif ($portmaxinit >= 424)
				setVar $MCIC "-83"
				setVar $multiple "1452"

			elseif ($portmaxinit >= 422)
				setVar $MCIC "-82"
				setVar $multiple "1446"

			elseif ($portmaxinit >= 420)
				setVar $MCIC "-81"
				setVar $multiple "1440"

			elseif ($portmaxinit >= 418)
				setVar $MCIC "-80"
				setVar $multiple "1434"

			elseif ($portmaxinit >= 416)
				setVar $MCIC "-79"
				setVar $multiple "1429"

			elseif ($portmaxinit >= 414)
				setVar $MCIC "-78"
				setVar $multiple "1423"

			elseif ($portmaxinit >= 412)
				setVar $MCIC "-77"
				setVar $multiple "1417"

			elseif ($portmaxinit >= 411)
				setVar $MCIC "-76"
				setVar $multiple "1411"

			elseif ($portmaxinit >= 409)
				setVar $MCIC "-75"
				setVar $multiple "1405"

			elseif ($portmaxinit >= 407)
				setVar $MCIC "-74"
				setVar $multiple "1399"

			elseif ($portmaxinit >= 405)
				setVar $MCIC "-73"
				setVar $multiple "1393"

			elseif ($portmaxinit >= 403)
				setVar $MCIC "-72"
				setVar $multiple "1387"

			elseif ($portmaxinit >= 401)
				setVar $MCIC "-71"
				setVar $multiple "1381"

			elseif ($portmaxinit >= 399)
				setVar $MCIC "-70"
				setVar $multiple "1375"

			elseif ($portmaxinit >= 397)
				setVar $MCIC "-69"
				setVar $multiple "1369"

			elseif ($portmaxinit >= 396)
				setVar $MCIC "-68"
				setVar $multiple "1363"

			elseif ($portmaxinit >= 394)
				setVar $MCIC "-67"
				setVar $multiple "1357"

			elseif ($portmaxinit >= 392)
				setVar $MCIC "-66"
				setVar $multiple "1351"

			elseif ($portmaxinit >= 390)
				setVar $MCIC "-65"
				setVar $multiple "1345"

			elseif ($portmaxinit >= 388)
				setVar $MCIC "-64"
				setVar $multiple "1342"

			elseif ($portmaxinit >= 386)
				setVar $MCIC "-63"
				setVar $multiple "1336"

			elseif ($portmaxinit >= 384)
				setVar $MCIC "-62"
				setVar $multiple "1330"

			elseif ($portmaxinit >= 382)
				setVar $MCIC "-61"
				setVar $multiple "1324"

			elseif ($portmaxinit >= 380)
				setVar $MCIC "-60"
				setVar $multiple "1318"

			elseif ($portmaxinit >= 378)
				setVar $MCIC "-59"
				setVar $multiple "1312"

			elseif ($portmaxinit >= 376)
				setVar $MCIC "-58"
				setVar $multiple "1306"

			elseif ($portmaxinit >= 374)
				setVar $MCIC "-57"
				setVar $multiple "1300"

			elseif ($portmaxinit >= 372)
				setVar $MCIC "-56"
				setVar $multiple "1294"

			elseif ($portmaxinit >= 370)
				setVar $MCIC "-55"
				setVar $multiple "1291"

			elseif ($portmaxinit >= 368)
				setVar $MCIC "-54"
				setVar $multiple "1285"

			elseif ($portmaxinit >= 366)
				setVar $MCIC "-53"
				setVar $multiple "1279"

			elseif ($portmaxinit >= 364)
				setVar $MCIC "-52"
				setVar $multiple "1273"

			elseif ($portmaxinit >= 362)
				setVar $MCIC "-51"
				setVar $multiple "1267"

			elseif ($portmaxinit >= 360)
				setVar $MCIC "-50"
				setVar $multiple "1261"

			elseif ($portmaxinit >= 358)
				setVar $MCIC "-49"
				setVar $multiple "1255"

			elseif ($portmaxinit >= 356)
				setVar $MCIC "-48"
				setVar $multiple "1249"

			elseif ($portmaxinit >= 354)
				setVar $MCIC "-46"
				setVar $multiple "1246"

			elseif ($portmaxinit >= 352)
				setVar $MCIC "-46"
				setVar $multiple "1240"

			elseif ($portmaxinit >= 350)
				setVar $MCIC "-45"
				setVar $multiple "1234"

			elseif ($portmaxinit >= 348)
				setVar $MCIC "-44"
				setVar $multiple "1228"

			elseif ($portmaxinit >= 346)
				setVar $MCIC "-43"
				setVar $multiple "1222"

			elseif ($portmaxinit >= 344)
				setVar $MCIC "-42"
				setVar $multiple "1219"

			elseif ($portmaxinit >= 342)
				setVar $MCIC "-41"
				setVar $multiple "1209"

			elseif ($portmaxinit >= 340)
				setVar $MCIC "-40"
				setVar $multiple "1208"

			else
				setVar $MCIC 0
				setVar $multiple "1208"
			end


		elseif ($prodtosell = "org")
			if ($portmaxinit >= 813)
				setVar $MCIC "-75"
				setVar $multiple "1405"

			elseif ($portmaxinit >= 810)
				setVar $MCIC "-74"
				setVar $multiple 1399

			elseif ($portmaxinit >= 806)
				setVar $MCIC "-73"
				setVar $multiple 1393

			elseif ($portmaxinit >= 802)
				setVar $MCIC "-72"
				setVar $multiple 1387

			elseif ($portmaxinit >= 798)
				setVar $MCIC "-71"
				setVar $multiple 1381

			elseif ($portmaxinit >= 795)
				setVar $MCIC "-70"
				setVar $multiple 1375

			elseif ($portmaxinit >= 791)
				setVar $MCIC "-69"
				setVar $multiple 1369

			elseif ($portmaxinit >= 787)
				setVar $MCIC "-68"
				setVar $multiple 1363

			elseif ($portmaxinit >= 783)
				setVar $MCIC "-67"
				setVar $multiple 1357

			elseif ($portmaxinit >= 779)
				setVar $MCIC "-66"
				setVar $multiple 1351

			elseif ($portmaxinit >= 775)
				setVar $MCIC "-65"
				setVar $multiple 1345

			elseif ($portmaxinit >= 772)
				setVar $MCIC "-64"
				setVar $multiple 1339

			elseif ($portmaxinit >= 768)
				setVar $MCIC "-63"
				setVar $multiple 1336

			elseif ($portmaxinit >= 764)
				setVar $MCIC "-62"
				setVar $multiple 1330

			elseif ($portmaxinit >= 760)
				setVar $MCIC "-61"
				setVar $multiple 1324

			elseif ($portmaxinit >= 756)
				setVar $MCIC "-60"
				setVar $multiple 1318

			elseif ($portmaxinit >= 752)
				setVar $MCIC "-59"
				setVar $multiple 1312

			elseif ($portmaxinit >= 748)
				setVar $MCIC "-58"
				setVar $multiple 1306

			elseif ($portmaxinit >= 744)
				setVar $MCIC "-57"
				setVar $multiple 1300

			elseif ($portmaxinit >= 740)
				setVar $MCIC "-56"
				setVar $multiple 1294

			elseif ($portmaxinit >= 737)
				setVar $MCIC "-55"
				setVar $multiple 1291

			elseif ($portmaxinit >= 733)
				setVar $MCIC "-54"
				setVar $multiple 1285

			elseif ($portmaxinit >= 729)
				setVar $MCIC "-53"
				setVar $multiple 1279

			elseif ($portmaxinit >= 725)
				setVar $MCIC "-52"
				setVar $multiple 1273

			elseif ($portmaxinit >= 721)
				setVar $MCIC "-51"
				setVar $multiple 1267

			elseif ($portmaxinit >= 717)
				setVar $MCIC "-50"
				setVar $multiple 1261

			elseif ($portmaxinit >= 713)
				setVar $MCIC "-49"
				setVar $multiple 1255

			elseif ($portmaxinit >= 709)
				setVar $MCIC "-48"
				setVar $multiple 1252

			elseif ($portmaxinit >= 705)
				setVar $MCIC "-47"
				setVar $multiple 1246

			elseif ($portmaxinit >= 701)
				setVar $MCIC "-46"
				setVar $multiple 1236

			elseif ($portmaxinit >= 697)
				setVar $MCIC "-45"
				setVar $multiple 1233

			elseif ($portmaxinit >= 693)
				setVar $MCIC "-44"
				setVar $multiple 1227

			elseif ($portmaxinit >= 688)
				setVar $MCIC "-43"
				setVar $multiple 1224

			elseif ($portmaxinit >= 684)
				setVar $MCIC "-42"
				setVar $multiple 1214

			elseif ($portmaxinit >= 680)
				setVar $MCIC "-41"
				setVar $multiple 1213

			elseif ($portmaxinit >= 676)
				setVar $MCIC "-40"
				setVar $multiple 1203

			elseif ($portmaxinit >= 672)
				setVar $MCIC "-39"
				setVar $multiple 1200

			elseif ($portmaxinit >= 668)
				setVar $MCIC "-38"
				setVar $multiple 1194

			elseif ($portmaxinit >= 664)
				setVar $MCIC "-37"
				setVar $multiple 1191

			elseif ($portmaxinit >= 660)
				setVar $MCIC "-36"
				setVar $multiple 1181

			elseif ($portmaxinit >= 656)
				setVar $MCIC "-35"
				setVar $multiple 1178

			elseif ($portmaxinit >= 651)
				setVar $MCIC "-34"
				setVar $multiple 1172

			elseif ($portmaxinit >= 647)
				setVar $MCIC "-33"
				setVar $multiple 1166

			elseif ($portmaxinit >= 643)
				setVar $MCIC "-32"
				setVar $multiple 1160

			elseif ($portmaxinit >= 639)
				setVar $MCIC "-31"
				setVar $multiple 1157

			elseif ($portmaxinit >= 635)
				setVar $MCIC "-30"
				setVar $multiple 1154

			else
				setVar $MCIC 0
				setVar $multiple "1154"
			end

		elseif ($prodtosell = "equ")
			if ($portmaxinit >= 1393)
				setVar $MCIC "-65"
				setVar $multiple 1347

			elseif ($portmaxinit >= 1386)
				setVar $MCIC "-64"
				setVar $multiple 1341

			elseif ($portmaxinit >= 1379)
				setVar $MCIC "-63"
				setVar $multiple 1336

			elseif ($portmaxinit >= 1372)
				setVar $MCIC "-62"
				setVar $multiple 1330

			elseif ($portmaxinit >= 1365)
				setVar $MCIC "-61"
				setVar $multiple 1324

			elseif ($portmaxinit >= 1358)
				setVar $MCIC "-60"
				setVar $multiple 1319

			elseif ($portmaxinit >= 1351)
				setVar $MCIC "-59"
				setVar $multiple 1313

			elseif ($portmaxinit >= 1344)
				setVar $MCIC "-58"
				setVar $multiple 1307

			elseif ($portmaxinit >= 1337)
				setVar $MCIC "-57"
				setVar $multiple 1302

			elseif ($portmaxinit >= 1329)
				setVar $MCIC "-56"
				setVar $multiple 1296

			elseif ($portmaxinit >= 1323)
				setVar $MCIC "-55"
				setVar $multiple 1291

			elseif ($portmaxinit >= 1315)
				setVar $MCIC "-54"
				setVar $multiple 1285

			elseif ($portmaxinit >= 1308)
				setVar $MCIC "-53"
				setVar $multiple 1279

			elseif ($portmaxinit >= 1301)
				setVar $MCIC "-52"
				setVar $multiple 1274

			elseif ($portmaxinit >= 1294)
				setVar $MCIC "-51"
				setVar $multiple 1268

			elseif ($portmaxinit >= 1287)
				setVar $MCIC "-50"
				setVar $multiple 1262

			elseif ($portmaxinit >= 1279)
				setVar $MCIC "-49"
				setVar $multiple 1254

			elseif ($portmaxinit >= 1272)
				setVar $MCIC "-48"
				setVar $multiple 1247

			elseif ($portmaxinit >= 1265)
				setVar $MCIC "-47"
				setVar $multiple 1246

			elseif ($portmaxinit >= 1258)
				setVar $MCIC "-46"
				setVar $multiple 1241

			elseif ($portmaxinit >= 1251)
				setVar $MCIC "-45"
				setVar $multiple 1235

			elseif ($portmaxinit >= 1243)
				setVar $MCIC "-44"
				setVar $multiple 1229

			elseif ($portmaxinit >= 1236)
				setVar $MCIC "-43"
				setVar $multiple 1224

			elseif ($portmaxinit >= 1229)
				setVar $MCIC "-42"
				setVar $multiple 1218

			elseif ($portmaxinit >= 1221)
				setVar $MCIC "-41"
				setVar $multiple 1213

			elseif ($portmaxinit >= 1214)
				setVar $MCIC "-40"
				setVar $multiple 1208

			elseif ($portmaxinit >= 1206)
				setVar $MCIC "-39"
				setVar $multiple 1201

			elseif ($portmaxinit >= 1199)
				setVar $MCIC "-38"
				setVar $multiple 1196

			elseif ($portmaxinit >= 1192)
				setVar $MCIC "-37"
				setVar $multiple 1190

			elseif ($portmaxinit >= 1184)
				setVar $MCIC "-36"
				setVar $multiple 1185

			elseif ($portmaxinit >= 1177)
				setVar $MCIC "-35"
				setVar $multiple 1180

			elseif ($portmaxinit >= 1169)
				setVar $MCIC "-34"
				setVar $multiple 1174

			elseif ($portmaxinit >= 1162)
				setVar $MCIC "-33"
				setVar $multiple 1169

			elseif ($portmaxinit >= 1154)
				setVar $MCIC "-32"
				setVar $multiple 1164

			elseif ($portmaxinit >= 1147)
				setVar $MCIC "-31"
				setVar $multiple 1158

			elseif ($portmaxinit >= 1139)
				setVar $MCIC "-30"
				setVar $multiple 1152

			elseif ($portmaxinit >= 1132)
				setVar $MCIC "-29"
				setVar $multiple 1149

			elseif ($portmaxinit >= 1124)
				setVar $MCIC "-28"
				setVar $multiple 1144

			elseif ($portmaxinit >= 1116)
				setVar $MCIC "-27"
				setVar $multiple 1136

			elseif ($portmaxinit >= 1109)
				setVar $MCIC "-26"
				setVar $multiple 1132

			elseif ($portmaxinit >= 1101)
				setVar $MCIC "-25"
				setVar $multiple 1126

			elseif ($portmaxinit >= 1093)
				setVar $MCIC "-24"
				setVar $multiple 1122

			elseif ($portmaxinit >= 1086)
				setVar $MCIC "-23"
				setVar $multiple 1117

			elseif ($portmaxinit >= 1078)
				setVar $MCIC "-22"
				setVar $multiple 1110

			elseif ($portmaxinit >= 1071)
				setVar $MCIC "-21"
				setVar $multiple 1105

			elseif ($portmaxinit >= 1063)
				setVar $MCIC "-20"
				setVar $multiple 1102

			else
				setVar $MCIC "0"
				setVar $multiple 1102

			end
		end

		# has to be done this way because of TWX numeric upper limit of 2.14 billion
		setVar $counter $offer
		divide $counter 10
		multiply $counter $multiple
		divide $counter 100
		send $counter & "*"
		setVar $midhaggles 0
	:sellofferloop
		setTextLineTrigger sellprice :sellprice "We'll buy them for"
		setTextLineTrigger sellfinaloffer :sellfinaloffer "Our final offer"
		# setTextLineTrigger sellnotinterested :sellnotinterested "We're not interested."
		setTextLineTrigger sellexperience :sellexperience "experience point(s)"
		setTextLineTrigger sellyouhave :sellyouhave "You have"

		setTextLineTrigger sellscrewup1 :sellscrewup "Get real ion-brain, make me a real offer."
		setTextLineTrigger sellscrewup2 :sellscrewup "This is the big leagues Jr.  Make a real offer."
		setTextLineTrigger sellscrewup3 :sellscrewup "My patience grows short with you."
		setTextLineTrigger sellscrewup4 :sellscrewup "I have much better things to do than waste my time.  Try again."
		setTextLineTrigger sellscrewup5 :sellscrewup "HA! HA, ha hahahhah hehehe hhhohhohohohh!  You choke me up!"
		setTextLineTrigger sellscrewup6 :sellscrewup "Quit playing around, you're wasting my time!"
		setTextLineTrigger sellscrewup7 :sellscrewup "Make a real offer or get the h"
		setTextLineTrigger sellscrewup8 :sellscrewup "WHAT?!@!? you must be crazy!"
		setTextLineTrigger sellscrewup9 :sellscrewup "So, you think I'm as stupid as you look? Make a real offer."
		setTextLineTrigger sellscrewup10 :sellscrewup "What do you take me for, a fool?  Make a real offer!"
		setTextLineTrigger sellscrewup11 :sellscrewup "Swine, go peddle your wares somewhere else, you make me sick."
		setTextLineTrigger sellscrewup12 :sellscrewup "I see you are as stupid as you look, get lost..."
		setTextLineTrigger sellscrewup13 :sellscrewup "HA!  You think me a fool?  Thats insane!  Get out of here!"
		setTextLineTrigger sellscrewup14 :sellscrewup "Get lost creep, that junk isn't worth half that much!"
		setTextLineTrigger sellscrewup15 :sellscrewup "I think you'd better leave if you value your life!"
		pause
		pause
	:sellscrewup
		killtrigger sellprice 
		killtrigger sellfinaloffer
		killtrigger sellexperience
		killtrigger sellyouhave
		killtrigger sellscrewup1 
		killtrigger sellscrewup2 
		killtrigger sellscrewup3 
		killtrigger sellscrewup4
		killtrigger sellscrewup5
		killtrigger sellscrewup6
		killtrigger sellscrewup7 
		killtrigger sellscrewup8 
		killtrigger sellscrewup9 
		killtrigger sellscrewup10 
		killtrigger sellscrewup11 
		killtrigger sellscrewup12
		killtrigger sellscrewup13 
		killtrigger sellscrewup14 
		killtrigger sellscrewup15 
	echo "*## PICKUP up sell fail"
		goto :sellhagglefailed
	echo "*### HSOULD NOT GET HERE NOW"
	# HAMMER -  This used to send anohter off but on v2 it sends you to the next product or command prompt
	# I'm wondering if this is a version issue? i.e. between v1 and v2.
		multiply $counter 98
		divide $counter 100
		send $counter & "*"
		goto :sellofferloop
	:sellprice
		killtrigger sellprice 
		killtrigger sellfinaloffer
		killtrigger sellexperience
		killtrigger sellyouhave
		killtrigger sellscrewup1 
		killtrigger sellscrewup2 
		killtrigger sellscrewup3 
		killtrigger sellscrewup4
		killtrigger sellscrewup5
		killtrigger sellscrewup6
		killtrigger sellscrewup7 
		killtrigger sellscrewup8 
		killtrigger sellscrewup9 
		killtrigger sellscrewup10 
		killtrigger sellscrewup11 
		killtrigger sellscrewup12
		killtrigger sellscrewup13 
		killtrigger sellscrewup14 
	killtrigger sellscrewup15
	 add $midhaggles 1
		setVar $old_offer $offer
		setVar $old_counter $counter
		getWord CURRENTLINE $offer 5
		striptext $offer ","

			# new method
			setVar $offer_change $offer
			subtract $offer_change $old_offer
			if ($MCIC > "-35")
				multiply $offer_change 75
				divide $offer_change 100
				subtract $counter $offer_change
				subtract $counter 25
			elseif ($MCIC > "-55")
				multiply $offer_change 65
				divide $offer_change 100
				subtract $counter $offer_change
				subtract $counter 25
			else
				multiply $offer_change 60
				divide $offer_change 100
				subtract $counter $offer_change
				subtract $counter 10
			end
		send $counter & "*"
		goto :sellofferloop
	:sellfinaloffer
		killtrigger sellprice 
		killtrigger sellfinaloffer
		killtrigger sellexperience
		killtrigger sellyouhave
		killtrigger sellscrewup1 
		killtrigger sellscrewup2 
		killtrigger sellscrewup3 
		killtrigger sellscrewup4
		killtrigger sellscrewup5
		killtrigger sellscrewup6
		killtrigger sellscrewup7 
		killtrigger sellscrewup8 
		killtrigger sellscrewup9 
		killtrigger sellscrewup10
		killtrigger sellscrewup11 
		killtrigger sellscrewup12
		killtrigger sellscrewup13 
		killtrigger sellscrewup14 
	killtrigger sellscrewup15

		# ore -  51,  54,  56   so...  25000, make sure we get 1 mid
		# org -  94,  99, 102   so...  15000, make sure we get 1 mid...  25,000, make sure we get 2 mids
		# equ - 160, 166, 170   so...  12000, make sure we get 1 mid...  20,000, make sure we get 2 mids
		if (($prodtosell = "ore") and ($MCIC <= "-75") and ($portbuying >= 25000) and ($midhaggles < 1) and ($ore_sell_failures < 2))
			setVar $forcefail 1
			setVar $thisorefailed 1
		elseif (($prodtosell = "org") and ($MCIC <= "-60") and ($portbuying >= 25000) and ($midhaggles < 2) and (($thisorefailed = 1) or ($org_sell_failures < 4)))
			setVar $forcefail 1
			setVar $thisorgfailed 1
		elseif (($prodtosell = "org") and ($MCIC <= "-60") and ($portbuying >= 15000) and ($midhaggles < 1) and (($thisorefailed = 1) or ($org_sell_failures < 2)))
			setVar $forcefail 1
			setVar $thisorgfailed 1
		elseif (($prodtosell = "equ") and ($MCIC <= "-55") and ($portbuying >= 20000) and ($midhaggles < 2) and (($thisorefailed = 1) or ($thisorgfailed = 1) or ($equ_sell_failures < 4)))
			setVar $forcefail 1
			setVar $thisequfailed 1
		elseif (($prodtosell = "equ") and ($MCIC <= "-55") and ($portbuying >= 12000) and ($midhaggles < 1) and (($thisorefailed = 1) or ($thisorgfailed = 1) or ($equ_sell_failures < 2)))
			setVar $forcefail 1
			setVar $thisequfailed 1
		else
			setVar $forcefail 0
		end
		setSectorParameter $player~current_sector "MCIC" $mcic
	if ($prodtosell = "ore")
		setSectorParameter $player~current_sector "ORE-MCIC" $mcic
	elseif ($prodtosell = "org")
		setSectorParameter $player~current_sector "ORG-MCIC" $mcic
	elseif ($prodtosell = "equ")
		setSectorParameter $player~current_sector "EQU-MCIC" $mcic
	end

		if ($forcefail = 0)
			setVar $old_offer $offer
			setVar $old_counter $counter
			getWord CURRENTLINE $offer 5
			striptext $offer ","
			setVar $offer_change $offer
			subtract $offer_change $old_offer
			if ($prodtosell = "ore")
				multiply $offer_change 30
			elseif ($prodtosell = "org")
				multiply $offer_change 27
			elseif ($prodtosell = "equ")
				multiply $offer_change 25
			end
			divide $offer_change 10
			subtract $counter $offer_change
			subtract $counter 10
			send $counter & "*"
		else
			# fail the haggle on purpose
			send $counter & "*"
		end
		goto :sellofferloop
	:sellnotinterested
		killtrigger sellprice 
		killtrigger sellfinaloffer
		killtrigger sellexperience
		killtrigger sellyouhave
		killtrigger sellscrewup1 
		killtrigger sellscrewup2 
		killtrigger sellscrewup3 
		killtrigger sellscrewup4
		killtrigger sellscrewup5
		killtrigger sellscrewup6
		killtrigger sellscrewup7 
		killtrigger sellscrewup8 
		killtrigger sellscrewup9 
		killtrigger sellscrewup10 
		killtrigger sellscrewup11 
		killtrigger sellscrewup12
		killtrigger sellscrewup13 
		killtrigger sellscrewup14 
	killtrigger sellscrewup15

		goto :sellhagglefailed
	:sellexperience
		killtrigger sellprice 
		killtrigger sellfinaloffer
		killtrigger sellexperience
		killtrigger sellyouhave
		killtrigger sellscrewup1 
		killtrigger sellscrewup2 
		killtrigger sellscrewup3 
		killtrigger sellscrewup4
		killtrigger sellscrewup5
		killtrigger sellscrewup6
		killtrigger sellscrewup7 
		killtrigger sellscrewup8 
		killtrigger sellscrewup9 
		killtrigger sellscrewup10 
		killtrigger sellscrewup11 
		killtrigger sellscrewup12
		killtrigger sellscrewup13 
		killtrigger sellscrewup14 

		getWord CURRENTLINE $exp_bonus 7
		add $EXPERIENCE $exp_bonus
		goto :sellofferloop
	:sellyouhave
		killtrigger sellprice 
		killtrigger sellfinaloffer
		killtrigger sellexperience
		killtrigger sellyouhave
		killtrigger sellscrewup1 
		killtrigger sellscrewup2 
		killtrigger sellscrewup3 
		killtrigger sellscrewup4
		killtrigger sellscrewup5
		killtrigger sellscrewup6
		killtrigger sellscrewup7 
		killtrigger sellscrewup8 
		killtrigger sellscrewup9 
		killtrigger sellscrewup10 
		killtrigger sellscrewup11 
		killtrigger sellscrewup12
		killtrigger sellscrewup13 
		killtrigger sellscrewup14 
	killtrigger sellscrewup15
		setVar $oldcredits $PLAYER~credits
		getWord CURRENTLINE $CREDITS 3
		stripText $CREDITS ","

		if ($oldcredits = $CREDITS)
			setVar $currenthaggle "failed"
			goto :sellhagglefailed
		else
			setVar $currenthaggle "succeeded"
			goto :sellhagglesucceeded
		end
	:sellhagglefailed
		if ($prodtosell = "ore")
			add $ore_sell_failures 1
		elseif ($prodtosell = "org")
			add $org_sell_failures 1
		elseif ($prodtosell = "equ")
			add $equ_sell_failures 1
		end
		if ($selldelay > 99)
			setDelayTrigger selldelay :selldelay $selldelay
			pause
			:selldelay
		end
		return

	:sellhagglesucceeded
		setVar $perunit $counter
		divide $perunit $portbuying

		#setVar $selloutput "'"
		setVar $selloutput ""
		setVar $selloutput $selloutput & $portbuying & " " & $prodtosell & " for " & $counter & " cr"
		setVar $selloutput $selloutput & " - "
		if ($prodtosell = "ore")
			setVar $selloutput $selloutput & $ore_sell_failures
		elseif ($prodtosell = "org")
			setVar $selloutput $selloutput & $org_sell_failures
		elseif ($prodtosell = "equ")
			setVar $selloutput $selloutput & $equ_sell_failures
		end
		setVar $selloutput $selloutput & " fails"
		setVar $selloutput $selloutput & " - " & $perunit & "/unit"
		#setVar $selloutput $selloutput & " - PMI " & $portmaxinit
		#setVar $selloutput $selloutput & " - MULT " & $multiple
		setVar $selloutput $selloutput & " - MCIC " & $MCIC
		if ($prodtosell = "ore")
			setVar $selloutput $selloutput & "/-90*"
			setVar $oreselloutput $selloutput
			setVar $oreprofit $counter
		elseif ($prodtosell = "org")
			setVar $selloutput $selloutput & "/-75*"
			setVar $orgselloutput $selloutput
			setVar $orgprofit $counter
		elseif ($prodtosell = "equ")
			setVar $selloutput $selloutput & "/-65*"
			setVar $equselloutput $selloutput
			setVar $equprofit $counter
		end

		if ($selldelay > 99)
			setDelayTrigger selldelay :selldelay2 $selldelay
			pause
			pause
			:selldelay2
		end
		return



:negotiateLand
	if ($startingLocation = "Citadel")
		send "L " & $planet & "* "
	gosub :getPlanetInfo
	send "c "
	elseif ($startingLocation = "Planet")
		send "L " & $planet & "* "
	gosub :getPlanetInfo
	end
	return


:exitneg
return
# ==============================  END PLANET NEGOTIATION ========================

include "source\bot_includes\player\getinfo\player"
include "source\bot_includes\player\swathoff\player"
include "source\bot_includes\planet\getplanetinfo\planet"
