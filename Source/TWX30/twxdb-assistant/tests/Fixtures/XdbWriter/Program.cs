// Independent BinaryWriter fixtures matching Source/Core/Database.cs serialization.
using System.Text.Json;
var output=args[0];Directory.CreateDirectory(output);
foreach(byte version in Enumerable.Range(10,10).Select(v=>(byte)v))
{
    var far=version>=16?70000:43;
    using(var w=new BinaryWriter(File.Create(Path.Combine(output,$"v{version}.xdb"))))
    {
        w.Write("TWX30");w.Write(version);w.Write(100000);w.Write((ushort)6543);w.Write((ushort)11);w.Write((ushort)12);
        w.Write("fixture.invalid");w.Write("Fixture café");w.Write((ushort)2002);w.Write((ushort)2300);
        w.Write("login.ts");w.Write("fixture-only-password");w.Write("Fixture user");w.Write('Ω');w.Write("fixture.ico");w.Write(true);w.Write(false);w.Write((byte)3);w.Write((byte)4);w.Write(637000000000000000L);
        if(version>=11)w.Write('§');
        if(version>=17){w.Write("universe-fixture");w.Write("hash-fixture");w.Write(638000000000000000L);}
        w.Write(2);
        foreach(var id in new[]{42,far})
        {
            w.Write(id);
            for(var i=0;i<6;i++){var warp=i==0?(id==42?far:42):0;if(version>=16)w.Write(warp);else w.Write((ushort)warp);}
            w.Write(id==42);
            if(id==42){w.Write("Port café");w.Write(false);w.Write((byte)2);w.Write((byte)3);for(var i=0;i<3;i++){w.Write(i%2==0);w.Write((byte)(30+i));w.Write((ushort)(12000+i));}w.Write(639000000000000000L);}
            w.Write((byte)7);
            foreach(var kind in new[]{"fighters","armids","limpets"}){w.Write(kind=="fighters"?1234:kind=="armids"?17:23);w.Write("Corp "+kind);w.Write((byte)2);}
            w.Write("Constellation Ω");w.Write("Beacon §");w.Write(637123456789000000L);w.Write(true);w.Write(987);w.Write((byte)1);w.Write((byte)2);
            w.Write(1);w.Write("Ship café");w.Write("Owner café");w.Write("Merchant Cruiser");w.Write(3456);
            w.Write(1);w.Write("Trader café");w.Write("Scout");w.Write("Trader ship");w.Write(4567);if(version>=15)w.Write("Admiral Trader café [7]");
            w.Write(1);w.Write("Display planet");w.Write(3);
            foreach(var pair in new[]{("FIGSEC","1"),("MSLSEC","0"),("Custom.Mixed.Name","Saved value")}){w.Write(pair.Item1);w.Write(pair.Item2);}
            w.Write(1);if(version>=16)w.Write(id==42?far:42);else w.Write((ushort)(id==42?far:42));
        }
        w.Write(2);
        foreach(var id in new[]{22,23})
        {
            w.Write(id);w.Write(id==22?"Planet café":"Unknown planet");w.Write(42);w.Write(id-21);w.Write("Planet Corp");w.Write(id==22?6:-1);w.Write(id==22);w.Write(true);
            foreach(var amount in new[]{7654,3000000,4000000,2000000})w.Write(id==22?amount:-1);
            if(version>=18){w.Write(true);w.Write("Citadel");w.Write(8);}
            if(version>=19){w.Write(111);w.Write(222);w.Write(333);}
        }
    }
}
