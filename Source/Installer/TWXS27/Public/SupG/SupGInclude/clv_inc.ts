:sendclv
send "clv"
:sentclv
setVar $cnt 0
waitFor "--- --------------------- --"
:trig
setTextLineTrigger clv :clv
pause

:clv
getWord CURRENTLINE $stopper 1
if ($stopper <> 0) AND ($stopper <> "Computer")
	cutText CURRENTLINE $traderName 30 31
	setVar $word $traderName
	gosub :trim
	setVar $traderName $word
	cutText CURRENTLINE $shipType 61 9999
	setVar $word $shipType
	gosub :trim
	setVar $shipType $word
	cutText CURRENTLINE $exp 5 9
	stripText $exp ","
	stripText $exp " "
	cutText CURRENTLINE $aln 15 10
	stripText $aln ","
	stripText $aln " "
	cutText CURRENTLINE $corp 26 3
	stripText $corp " "
	if ($init = 1)
		setVar $exists[$traderName] 1
		setVar $playerShip[$traderName] $shipType
		setVar $playerExp[$traderName] $exp
		setVar $playerAln[$traderName] $aln
		setVar $playerCorp[$traderName] $corp
		setVAr $init 0
	else
		if ($exists[$traderName] = 1)
			if ($shipType <> $playerShip[$traderName]) 
				add $cnt 1
				setVar $change[$cnt] $traderName & " is now in " & $shipType & "."
			end
			if ($exp <> $playerExp[$traderName])
				setVar $diff ($exp - $playerExp[$traderName])
				if ($diff >= 500) OR ($diff <= "-500")
					add $cnt 1
					if ($diff > 500)
						setVar $diff "+" & $diff
					end
					setVar $change[$cnt] $traderName & " changed experience " & $diff & "."
				end
			end
			if ($aln <> $playerAln[$traderName])
				setVar $diff ($aln - $playerAln[$traderName])
				if ($diff >= 1000) OR ($diff <= "-1000")
					add $cnt 1
					setVar $change[$cnt] $traderName & " changed alignment " & $diff & "."
				end
			end
			if ($corp <> $playerCorp[$traderName])
				add $cnt 1
				setVAr $change[$cnt]  $traderName & " changed to corp " & $corp & "."
			end
		end
		setVar $exists[$traderName] 1
		setVar $playerShip[$traderName] $shipType
		setVar $playerExp[$traderName] $exp
		setVar $playerAln[$traderName] $aln
		setVar $playerCorp[$traderName] $corp
	end
	goto :trig
end
if ($dataman = 1)
	return
end
send "Q"

:print
if ($cnt > 0)
	send "'*"
	setVar $prnter 0
	:prnter
	if ($prnter < $cnt)
		add $prnter 1
		send " CLV: " $change[$prnter] "*"
		goto :prnter
	end
	send "*"
end
return

:trim
setVAr $trim 0
getLength $word $wordLen
setVar $backcnt $wordLen
:backcnt
if ($backcnt >= 1)
     cutText $word $letter $backcnt 1
     if ($letter = " ")
          subtract $backcnt 1
          add $trim 1
          goto :backcnt
     end
end
if ($trim > 0)
     setVar $endTrim ($wordLen - $trim)
     cutText $word $word 1 $endTrim
end
return