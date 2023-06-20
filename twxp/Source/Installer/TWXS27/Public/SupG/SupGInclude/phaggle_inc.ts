##################################################################
:planet_neg
setVar $ni 0
setVar $ore 0
setVar $org 0
setVar $equ 0
setVar $oreMCIC "-90"
setVar $orgMCIC "-75"
setVar $equMCIC "-65"
if ($sdt = 1) or ($selloff = 1)
	send "PN"
	waitFor "<Negotiate Planetary TradeAgreement>"
end
setTextLineTrigger orepct :orepct "Fuel Ore   Buying"
setTextLineTrigger orgpct :orgpct "Organics   Buying"
setTextLineTrigger equpct :equpct "Equipment  Buying"
setTextTrigger gotpercts :gotpercts "Registry# and Planet Name"
setTextTrigger noplninf :noplninf "Negotiate agreement"
pause

:noplninf
killtrigger orepct
killtrigger orgpct
killtrigger equpct
killtrigger gotpercts
killtrigger noplninf
echo ANSI_15 "Could not obtain port information, unable to use Advanced Planet Trading."
return

:orepct
killtrigger noplninf
getWord CURRENTLINE $oretrading 4
getWord CURRENTLINE $orepercent 5
striptext $orepercent "%"
if ($orepercent < 100)
	add $orepercent 1
end
pause

:orgpct
killtrigger noplninf
getWord CURRENTLINE $orgtrading 3
getWord CURRENTLINE $orgpercent 4
striptext $orgpercent "%"
if ($orgpercent < 100)
	add $orgpercent 1
end
pause

:equpct
killtrigger noplninf
getWord CURRENTLINE $equtrading 3
getWord CURRENTLINE $equpercent 4
striptext $equpercent "%"
if ($equpercent < 100)
	add $equpercent 1
end
pause

:gotpercts
killtrigger orepct
killtrigger orgpct
killtrigger equpct
if ($sdt =1)
	if ($pnum = "Auto") OR ($pnum = 0)
		:sdt_pnum
		waitfor "-----------------"
		setTextLineTrigger num :num "<"
		pause
	
		:num
		getText CURRENTLINE $pnum "<" ">"
		stripText $pnum " "
		send $pnum "*"
	else
		send $pnum "*"
	end
end
if ($selloff = 1)
	send $pnum "*"
end

:sellproduct
setTextTrigger sellfuel :sellfuel "How many units of Fuel Ore"
setTextTrigger sellorg :sellorg "How many units of Organics"
setTextTrigger sellequ :sellequ "How many units of Equipment"
setTextLineTrigger selling :amnt_selling "Agreed, "
setTextTrigger donewithport :donewithport "] (?=Help)?"
pause

:sellfuel
killtrigger ni
setVar $prodtosell "ore"
if ($sdt = 1) or ($selloff = 1)
	send "0*"
end
pause

:sellorg 
killtrigger ni
setVar $prodtosell "org"
if ($sdt = 1)
	send "0*"
end
if ($selloff = 1) 
	if ($sellprod = "Organics") OR ($sellprod = "Both")
		if ($orgpercent < $minPerc)
			send "0*"
		else
			send "*"
		end
	else
		send "0*"
	end
end
pause

:sellequ
killtrigger ni
if ($sdt = 1)
	send "*"
end
if ($selloff = 1) 
	if ($sellprod = "Equipment") OR ($sellprod = "Both")
		if ($equpercent < $minPerc)
			send "0*"
		else
			send "*"
		end
	else
		send "0*"
	end
end
setVar $prodtosell "equ"
pause

:amnt_selling
killtrigger sellfuel
killtrigger sellorg
killtrigger sellequ
killtrigger donewithport
getWord CURRENTLINE $amnt_sell 2
striptext $amnt_sell ","

:sellhaggle
setTextLineTrigger sellfirstoffer :sellfirstoffer "We'll buy them for"
pause

:sellfirstoffer
getWord CURRENTLINE $offer 5
striptext $offer ","


# ----- CALCULATE the port's "quality" -----

setVar $perunitinitoffer $offer
# multiply by 100 to increase accuracy of results, we'll need to divide by 100 later
multiply $perunitinitoffer 100
# divide by the number of units you are selling
divide $perunitinitoffer $amnt_sell
#initialize portmaxinit
setVar $portmaxinit $perunitinitoffer
# return to 10 scale
divide $perunitinitoffer 10

if ($prodtosell = "ore")
# port max init  =(($perunitinitoffer-25.60558)/($percent-11.7248))*(88.2752)+25.60558
	setVar $basevalue 256055800
	setVar $basepercent 11725
	setVar $basepercentinverse 88275
	setVar $percentfrombase $orepercent
elseif ($prodtosell = "org")
# port max init  =(($perunitinitoffer-50.62764)/($percent-11.28715))*(88.71285)+50.62764
	setVar $basevalue 506276400
	setVar $basepercent 11287
	setVar $basepercentinverse 88713
	setVar $percentfrombase $orgpercent
elseif ($prodtosell = "equ")
# port max init  =(($perunitinitoffer-90.6281)/($percent-10.98921))*(89.01079)+90.6281
	setVar $basevalue 906281000
	setVar $basepercent 10989
	setVar $basepercentinverse 89010
	setVar $percentfrombase $equpercent
end

if ($percentfrombase >= 15)
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
setVar $counter $offer
divide $counter 10
multiply $counter $multiple
# divide by 1000 instead of 100 because the multiple is in 10 scale
divide $counter 100
send $counter & "*"
waitfor $counter
setVar $midhaggles 0

:sellofferloop
setTextLineTrigger donehag :pdone_haggle "You have"
SetTextLineTrigger offerme :prehaggle "We'll buy them for"
setTextLineTrigger final :finaloffer "Our final offer is"
setTextTrigger ni :ni "We're not interested."
pause

:prehaggle
getWord CURRENTLINE $new_offer 5
striptext $new_offer ","
if ($new_offer = $offer)
	multiply $counter 98
        divide $counter 100
        send $counter & "*"
	waitFor $counter
        goto :sellofferloop
else
	getText CURRENTLINE $new_offer "for " " credits."
	stripText $new_offer ","
	setVar $offer_change $new_offer
        subtract $offer_change $offer
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
	setVar $offer $new_offer
	waitfor $counter
	add $midhaggles 1
	setTextTrigger offerme :prehaggle "We'll buy them for"
	pause
end

:finaloffer
killtrigger offerme

if (($prodtosell = "ore") and ($MCIC <= "-75") and ($amnt_sell >= 25000) and ($midhaggles < 1))
        setVar $forcefail 1
        setVar $thisorefailed 1
elseif (($prodtosell = "org") and ($MCIC <= "-60") and ($amnt_sell >= 25000) and ($midhaggles < 2) and ($thisorefailed = 1))
        setVar $forcefail 1
	setVar $thisorgfailed 1
elseif (($prodtosell = "org") and ($MCIC <= "-60") and ($amnt_sell >= 15000) and ($midhaggles < 1) and ($thisorefailed = 1))
        setVar $forcefail 1
	setVar $thisorgfailed 1
elseif (($prodtosell = "equ") and ($MCIC <= "-55") and ($amnt_sell >= 20000) and ($midhaggles < 2) and (($thisorefailed = 1) or ($thisorgfailed = 1)))
	setVar $forcefail 1
        setVar $thisequfailed 1
elseif (($prodtosell = "equ") and ($MCIC <= "-55") and ($amnt_sell >= 12000) and ($midhaggles < 1) and (($thisorefailed = 1) or ($thisorgfailed = 1)))
        setVar $forcefail 1
        setVar $thisequfailed 1
else
	setVar $forcefail 0
end

if ($forcefail = 0)
	getWord CURRENTLINE $new_offer 5
	striptext $new_offer ","
	setVar $offer_change $new_offer
	subtract $offer_change $offer
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
	pause
else
    # fail the haggle on purpose
	send $counter & "*"
	pause
end

:ni
setVar $ni 1
killtrigger donehag
goto :sellproduct

:pdone_haggle
killtrigger ni
if ($prodtosell = "ore")
	setVar $ore 1
	setVar $credperoreunit ($counter/$amnt_sell)
	setVar $oreamount $amnt_sell
	setVar $oreprice $counter
	setVar $fuelMCIC $MCIC
elseif ($prodtosell = "org")
	setVar $org 1
	setVar $credperorgunit ($counter/$amnt_sell)
	setVar $orgamount $amnt_sell
	setVar $orgprice $counter
	setVar $orgsMCIC $MCIC
elseif ($prodtosell = "equ")
	setVar $equ 1
	setVar $credperequunit ($counter/$amnt_sell)
	setVar $equamount $amnt_sell
	setVar $equprice $counter
	setVar $equipMCIC $MCIC
end
goto :sellproduct

:donewithport
killtrigger sellfuel
killtrigger sellorg
killtrigger sellequ
killtrigger selling
getText CURRENTLINE $sec "]:[" "] ("
send "'* CAP Trade, sold units:*"
if ($ore = 1)
	send "   Ore : " $oreamount " units for " $oreprice ", (" $credperoreunit "ppu) (mcic: " $fuelMCIC ")*"
	write GAMENAME & "_MCIC.txt" $sec & " - Ore - " & $fuelMCIC
end
if ($org = 1)
	send "   Orgs : " $orgamount " units for " $orgprice ", (" $credperorgunit "ppu) (mcic: " $orgsMCIC ")*"
	write GAMENAME & "_MCIC.txt" $sec & " - Orgs - " & $orgsMCIC
end
if ($equ = 1)
	send "   Equip : " $equamount " units for " $equprice ", (" $credperequunit "ppu) (mcic: " $equipMCIC ")*"
	write GAMENAME & "_MCIC.txt" $sec & " - Equip - " & $equipMCIC
end
send "*"
return
