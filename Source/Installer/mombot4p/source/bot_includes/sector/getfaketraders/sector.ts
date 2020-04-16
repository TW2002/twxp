:getFakeTraders
	setVar $federalsInSector FALSE
	setvar $federalCount 0
	getWordPos $sectorData $posShips "[0m[33mShips   [1m:"
	getWordPos $sectorData $posTraders "[0m[33mTraders [1m:"
	getWordPos $sectorData $posFederals "[0m[33mFederals[1m:"
	if ($posFederals > 0)
		setVar $federalsInSector TRUE
	end
	if ($posTraders > 0)
		getText $sectorData $fakeData "[1;32mSector  [33m:" "[0m[33mTraders [1m:"
		gosub :grabFakeData
	elseif ($posShips > 0)
		getText $sectorData $fakeData "[1;32mSector  [33m:" "[0m[33mShips   [1m:"
		gosub :grabFakeData
	else
		getText $sectorData $fakeData "[1;32mSector  [33m:" "[0m[1;32mWarps to Sector(s) [33m:"
		gosub :grabFakeData
	end
return
:grabFakeData
	setVar $fakeData $STARTLINE&$fakeData
	getText $fakeData $temp $STARTLINE $ENDLINE
	setVar $fakeTraderCount 0
	while ($temp <> "")
		getLength $STARTLINE&$temp&$ENDLINE $length
		cutText $fakeData $fakeData ($length+1) 9999
		stripText $temp $STARTLINE
		stripText $temp "  "
		stripText $temp $ENDLINE
		getWordPos $temp $pos "33m,[0;32m w/ "
		if ($pos <= 0)
			getWordPos $temp $pos "[0;32mw/ "
		end
		getWordPos $temp $pos2 "[33m, [0;32mwith"
		getWordPos $temp $pos3 "[0;35m[[31mOwned by[35m]"
		getWordPos $temp $pos4 "[0;32mw/ "&#27&"[1;33m"
		getWordPos $temp $pos5 "in[36m "
		if ((($pos4 > 0) OR ($pos > 0) OR ($pos2 > 0)) AND ($pos3 <= 0))
			setVar $PLAYER~FAKETRADERS[($fakeTraderCount+1)] $temp
			getWordPos $temp $posa "Zyrain"
			getWordPos $temp $posb "Clausewitz"
			getWordPos $temp $posc "Nelson"
			getWordPos $temp $posd "Wilson"
			if (($posa > 0) or ($posb > 0) or ($posc > 0) or ($posd > 0))
				add $federalCount 1
			end
			add $fakeTraderCount 1
		end
		#for capturing alien ship recognition once ansi ships are in array in bot
		if ($pos5 > 0)
			getText $temp $shipname "[1;31m"  ")"
			#getText $shipname $shipname "m"&#27 #27&"["
			if ($shipname = "")
				getText $temp $shipname "(" ")"&#13
				getText $shipname&"ENDOFSHIP" $shipname "m"&#27&"[" "ENDOFSHIP"
			end
			getText $shipname&"ENDOFSHIP" $shipname "m" "ENDOFSHIP"
		end

		getText $fakeData $temp $STARTLINE $ENDLINE
	end
return