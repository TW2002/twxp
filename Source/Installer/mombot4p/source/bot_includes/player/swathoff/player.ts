# ===========================  START SWATH DISABLING SUBROUTINE  =================
loadglobal $swathoff
:swathoff
	if ($swathoff = FALSE)
		setTextTrigger swathison :swathison "Command [TL="
		setDelayTrigger swathisoff :swathisoff 2000
		pause

		:swathison
		killtrigger swathisoff
		killtrigger swathison
		setVar $swathOffMessage "Detected SWATH Autohaggle"
		setVar $swathoff FALSE
        saveglobal $swathoff
		return

		:swathisoff
		killtrigger swathisoff
		killtrigger swathison
		setVar $swathoff TRUE
        saveglobal $swathoff
	end
return
# ==========================   END SWATH DISABLING SUBROUTINE  =================
