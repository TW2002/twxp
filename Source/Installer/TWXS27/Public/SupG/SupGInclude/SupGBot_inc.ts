:SupGBot_loadParms
loadVar $SupGBot_parm1
loadVar $SupGBot_parm2
loadVar $SupGBot_parm3
loadVar $SupGBot_parm4

setVar $parm1 $SupGBot_parm1
setVar $parm2 $SupGBot_parm2
setVAr $parm3 $SupGBot_parm3
setVar $parm4 $SupGBot_parm4

setVar $SupGBot_parm1 0
setVar $SupGBot_parm2 0
setVar $SupGBot_parm3 0
setVar $SupGBot_parm4 0
	
saveVar $SupGBot_parm1
saveVar $SupGBot_parm2
saveVar $SupGBot_parm3
saveVar $SupGBot_parm4

return

:SupGBot_disableCommands
processin 1 "SUPGBOT_DISABLE_COMMAND"
return

:SupGBot_enableCommands
processin 1 "SUPGBOT_ENABLE_COMMAND"
return