unit FormChangeIcon;

interface

uses
  Windows, Messages, SysUtils, Classes, Graphics, Controls, Forms, Dialogs,
  StdCtrls,shellapi,comobj, ComCtrls;

type
  TfrmChangeIcon = class(TForm)
    IconListView: TListView;
    procedure FormCreate(Sender: TObject);
    procedure FormDestroy(Sender: TObject);
  private
    { Private declarations }
  public
    { Public declarations }
  end;

var
  frmChangeIcon: TfrmChangeIcon;
  ImageList1: TimageList;

implementation

{$R *.dfm}

procedure TfrmChangeIcon.FormCreate(Sender: TObject);
var
  IconPath: string;
  IconIndex: Integer;
  hIconLarge, hIconSmall: HICON;
begin
  IconPath := 'C:\Windows\System32\imageres.dll';
  IconIndex := 0; // index can be other than 0

  ExtractIconEx(PChar(IconPath), IconIndex, hIconLarge, hIconSmall, 1);



  DestroyIcon(hIconSmall);
  DestroyIcon(hIconLarge);

end;


procedure TfrmChangeIcon.FormDestroy(Sender: TObject);
begin
  ImageList1.free;
end;

end.
