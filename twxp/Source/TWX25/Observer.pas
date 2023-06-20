{
Copyright (C) 2005  Remco Mulder

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

For source notes please refer to Notes.txt
For license terms please refer to GPL.txt.

These files should be stored in the root of the compression you 
received this source in.
}
unit Observer;

// Implements Observer pattern.

interface

uses
  Classes;

type
  TNotificationType = (ntAuthenticationDone, ntAuthenticationFailed);

  IObserver = interface
    ['{B74370EC-19EA-43FB-B304-D4F7407FA117}']
    procedure Notify(NoteType: TNotificationType);
  end;

  ISubject = interface
    ['{4B47712E-EDFB-4ECE-AA4B-82809F8A8F66}']
    procedure NotifyObservers(NoteType: TNotificationType);
    procedure RegisterObserver(const Observer: IObserver; OneNotifyOnly: Boolean = False);
    procedure UnregisterObserver(const Observer: IObserver);
  end;

  TObservation = class
  private
    FObserver: IObserver;
    FOneNotifyOnly: Boolean;
  public
    property Observer: IObserver read FObserver write FObserver;
    property OneNotifyOnly: Boolean read FOneNotifyOnly write FOneNotifyOnly;
  end;

  TObservations = array of TObservation;

  TSubject = class(TComponent, ISubject)
  private
    FObservations: TObservations;

    function GetObserverIndex(const Observer: IObserver): Integer;
  protected
    { ISubject }
    procedure NotifyObservers(NoteType: TNotificationType);
    procedure RegisterObserver(const Observer: IObserver; OneNotifyOnly: Boolean = False);
    procedure UnregisterObserver(const Observer: IObserver);
  end;

implementation

procedure TSubject.NotifyObservers(NoteType: TNotificationType);
var
  I: Integer;
  Observation: TObservation;
  Observer: IObserver;
begin
  I := 0;

  while (I < Length(FObservations)) do
  begin
    Observation := FObservations[I];
    Observer := Observation.Observer;

    if (Observation.OneNotifyOnly) then
      UnregisterObserver(Observer) // could perhaps be optimised ..
    else
      Inc(I);

    Observer.Notify(NoteType);
  end;
end;

procedure TSubject.RegisterObserver(const Observer: IObserver; OneNotifyOnly: Boolean = False);
var
  Index: Integer;
  Observation: TObservation;
begin
  Index := Length(FObservations);
  SetLength(FObservations, Index + 1);
  Observation := TObservation.Create;
  Observation.OneNotifyOnly := OneNotifyOnly;
  Observation.Observer := Observer;
  FObservations[Index] := Observation;
end;

procedure TSubject.UnregisterObserver(const Observer: IObserver);
var
  Index: Integer;
begin
  Index := GetObserverIndex(Observer);
  FObservations[Index].Free;

  Inc(Index);

  if (Index > 0) then
  begin
    // move the whole lot down
    while (Index < Length(FObservations)) do
      FObservations[Index - 1] := FObservations[Index];

    SetLength(FObservations, Index - 1);
  end;
end;

function TSubject.GetObserverIndex(const Observer: IObserver): Integer;
var
  I: Integer;
begin
  Result := -1;

  for I := 0 to Length(FObservations) - 1 do
    if (FObservations[I].Observer = Observer) then
      Result := I;

  Assert(Result >= 0, 'Observer not found');
end;

end.
