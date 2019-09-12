getInput $seconds "Seconds between checks?"
echo ANSI_15 "*Ignore port percentage changes?*"
getConsoleInput $heh SINGLEKEY
lowerCase $heh
setVar $cimhunt_inc~init 1

if ($heh = "y")
	setVar $cimhunt_inc~ignore 1
else
	setVAr $cimhunt_inc~ignore 0
end
setVar $milli ($seconds * 1000)
goto :go

:top
setDelayTrigger go :go $milli
pause

:go
gosub :cimhunt_inc~runcim
send "Q"
setVar $print_loop 0
if ($cimhunt_inc~used_port_count > 0)
	waitfor "?"
	send "'*"
	:print_results
	if ($print_loop	< $cimhunt_inc~used_port_count)
		add $print_loop 1
		send $cimhunt_inc~change_port[$print_loop] "*"
		write $cimhunt_inc~log_file $cimhunt_inc~change_port[$print_loop]
		goto :print_results
	else
		send "*"
	end
end
waitfor "(?="
goto :top

include "supginclude\cimhunt_inc"
