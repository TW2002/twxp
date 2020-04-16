:commasize
	getwordpos $value $pos "-"
	striptext $value "-"
	If ($value < 1000)
		#do nothing
	ElseIf ($value < 1000000)
    	getLength $value $len
		SetVar $len ($len - 3)
		cutText $value $tmp 1 $len
		cutText $value $tmp1 ($len + 1) 999
		SetVar $tmp $tmp & "," & $tmp1
		SetVar $value $tmp
	ElseIf ($value <= 999999999)
		getLength $value $len
		SetVar $len ($len - 6)
		cutText $value $tmp 1 $len
		SetVar $tmp $tmp & ","
		cutText $value $tmp1 ($len + 1) 3
		SetVar $tmp $tmp & $tmp1 & ","
		cutText $value $tmp1 ($len + 4) 999
		SetVar $tmp $tmp & $tmp1
		SetVar $value $tmp
	end
	if ($pos > 0)
		setvar $value "-"&$value
	end
return