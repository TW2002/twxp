#Author: Mind Dagger

:init
# ============================ START SECTOR DATA VARIABLES ==========================
		setVar $player~realTraderCount 0
		setVar $player~fakeTraderCount 0
		setVar $player~corpieCount     0
		setVar $player~emptyShipCount  0
		setVar $player~containsBeacon  FALSE
		setArray $player~TRADERS 	200
		setArray $player~FAKETRADERS  100
		setArray $player~EMPTYSHIPS   100
		setVar $player~ranksLength     46
	setArray $player~ranks     $player~rankslength
	setVar $player~ranks[1]    "36mCivilian"
	setVar $player~ranks[2]    "36mPrivate 1st Class"
	setVar $player~ranks[3]    "36mPrivate"
	setVar $player~ranks[4]    "36mLance Corporal"
	setVar $player~ranks[5]    "36mCorporal"
	setVar $player~ranks[6]    "36mStaff Sergeant"
	setVar $player~ranks[7]    "36mGunnery Sergeant"
	setVar $player~ranks[8]    "36m1st Sergeant"
	setVar $player~ranks[9]    "36mSergeant Major"
	setVar $player~ranks[10]   "36mSergeant"
	setVar $player~ranks[11]   "31mAnnoyance"
	setVar $player~ranks[12]   "31mNuisance 3rd Class"
	setVar $player~ranks[13]   "31mNuisance 2nd Class"
	setVar $player~ranks[14]   "31mNuisance 1st Class"
	setVar $player~ranks[15]   "31mMenace 3rd Class"
	setVar $player~ranks[16]   "31mMenace 2nd Class"
	setVar $player~ranks[17]   "31mMenace 1st Class"
	setVar $player~ranks[18]   "31mSmuggler 3rd Class"
	setVar $player~ranks[19]   "31mSmuggler 2nd Class"
	setVar $player~ranks[20]   "31mSmuggler 1st Class"
	setVar $player~ranks[21]   "31mSmuggler Savant"
	setVar $player~ranks[22]   "31mRobber"
	setVar $player~ranks[23]   "31mTerrorist"
	setVar $player~ranks[24]   "31mInfamous Pirate"
	setVar $player~ranks[25]   "31mNotorious Pirate"
	setVar $player~ranks[26]   "31mDread Pirate"
	setVar $player~ranks[27]   "31mPirate"
	setVar $player~ranks[28]   "31mGalactic Scourge"
	setVar $player~ranks[29]   "31mEnemy of the State"
	setVar $player~ranks[30]   "31mEnemy of the People"
	setVar $player~ranks[31]   "31mEnemy of Humankind"
	setVar $player~ranks[32]   "31mHeinous Overlord"
	setVar $player~ranks[33]   "31mPrime Evil"
	setVar $player~ranks[34]   "36mChief Warrant Officer"
	setVar $player~ranks[35]   "36mWarrant Officer"
	setVar $player~ranks[36]   "36mEnsign"
	setVar $player~ranks[37]   "36mLieutenant J.G."
	setVar $player~ranks[38]   "36mLieutenant Commander"
	setVar $player~ranks[39]   "36mLieutenant"
	setVar $player~ranks[40]   "36mCommander"
	setVar $player~ranks[41]   "36mCaptain"
	setVar $player~ranks[42]   "36mCommodore"
	setVar $player~ranks[43]   "36mRear Admiral"
	setVar $player~ranks[44]   "36mVice Admiral"
	setVar $player~ranks[45]   "36mFleet Admiral"
	setVar $player~ranks[46]   "36mAdmiral"
	setVar $player~lasttarget  ""

# ============================ END SECTOR DATA VARIABLES ==========================
return
