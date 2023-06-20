:commas
	if ($value < 1000)
		#do nothing
	elseif ($value < 1000000)
		getLength $value $len
		setVar $len ($len - 3)
		cutText $value $tmp 1 $len
		cutText $value $tmp1 ($len + 1) 999
		setVar $tmp $tmp & "," & $tmp1
		setVar $value $tmp
	elseif ($value <= 999999999)
		getLength $value $len
		setVar $len ($len - 6)
		cutText $value $tmp 1 $len
		setVar $tmp $tmp & ","
		cutText $value $tmp1 ($len + 1) 3
		setVar $tmp $tmp & $tmp1 & ","
		cutText $value $tmp1 ($len + 4) 999
		setVar $tmp $tmp & $tmp1
		setVar $value $tmp
	end
return
