using System;
using System.Collections.Generic;
using System.Linq;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Media;
using Avalonia.Rendering.SceneGraph;
using Avalonia.Skia;
using SkiaSharp;
using Core = TWXProxy.Core;

namespace MTC;

public enum TacticalMapViewMode
{
    Bubble,
    Hex,
}

/// <summary>
/// Compact tactical map used by the optional "command deck" skin.
/// It follows the current sector and renders the nearby bubble as either
/// the original node-link bubble view or a warp-count-driven hex view.
/// </summary>
public class TacticalMapControl : Control
{
    private const int ZoomedInDepth = 1;
    private const int ZoomedOutDepth = 6;
    private const float BubbleGridX = 110f;
    private const float BubbleGridY = 84f;
    private const float NodeRadius = 20f;
    private const float HexRadius = 34f;
    private const float HexGapFactor = 1.0f;
    private const float DefaultZoomFactor = 0.82f;
    private const float MinZoomFactor = 0.45f;
    private const float MaxZoomFactor = 1.75f;
    private const float ZoomStep = 0.12f;
    private const int PreviewDefaultContextSectors = 16;
    private const int PreviewMaxHighlightedSectors = 20;
    private const int PreviewMaxContextSectors = 360;
    private static readonly HexCell[] HexDirections =
    [
        new(1, 0),
        new(1, -1),
        new(0, -1),
        new(-1, 0),
        new(-1, 1),
        new(0, 1),
    ];
    private static readonly SKTypeface PopupTypeface = CreatePopupTypeface();

    private readonly Func<int> _getCurrentSector;
    private readonly Func<Core.ModDatabase?> _getDb;
    private readonly Func<GameState?>? _getState;
    private readonly (float X, float Y, float Size, byte Alpha)[] _stars;
    private MapSnapshot _lastSnapshot = new();
    private float _zoomFactor = DefaultZoomFactor;
    private TacticalMapViewMode _viewMode = TacticalMapViewMode.Bubble;
    private float _lastRenderScale;
    private float _lastRenderWidth;
    private float _lastRenderHeight;
    private float _lastWorldCenterX;
    private float _lastWorldCenterY;
    private bool _hasLiveLayout;
    private int _hoveredSectorNumber;
    private string? _hoveredSectorPopupText;
    private Point _hoverPoint;
    private int? _centerSectorOverride;
    private HashSet<int> _previewHighlightedSectors = [];
    private int _previewGateSector;
    private int _previewSurroundingDepth;
    private bool _previewLimitHighlightedSectors = true;
    private bool _previewZoomControlsDepth;
    private string? _previewLegendText;
    private Core.ModDatabase? _majorSpaceLaneDb;
    private long _majorSpaceLaneChangeStamp = long.MinValue;
    private HashSet<int> _majorSpaceLaneSectors = [];

    private static string GetViewModeLabel(TacticalMapViewMode viewMode)
    {
        return viewMode switch
        {
            TacticalMapViewMode.Hex => "HEX",
            _ => "MODERN",
        };
    }

    public TacticalMapControl(
        Func<int> getCurrentSector,
        Func<Core.ModDatabase?> getDb,
        Func<GameState?>? getState = null)
    {
        _getCurrentSector = getCurrentSector;
        _getDb = getDb;
        _getState = getState;
        ClipToBounds = true;
        PointerWheelChanged += OnPointerWheelChanged;
        PointerMoved += OnPointerMoved;
        PointerExited += OnPointerExited;
        DoubleTapped += OnDoubleTapped;

        var rng = new Random(1337);
        _stars = new (float, float, float, byte)[140];
        for (int i = 0; i < _stars.Length; i++)
        {
            _stars[i] = (
                (float)rng.NextDouble(),
                (float)rng.NextDouble(),
                0.7f + (float)rng.NextDouble() * 1.8f,
                (byte)(50 + rng.Next(130)));
        }
    }

    public int ZoomPercent => (int)Math.Round(_zoomFactor * 100f);
    public TacticalMapViewMode ViewMode => _viewMode;

    public event Action<TacticalMapControl>? ZoomChanged;
    public event Action<TacticalMapControl>? ViewModeChanged;
    public event Action<TacticalMapControl, int>? SectorDoubleClicked;

    public override void Render(DrawingContext context)
    {
        var bounds = new Rect(0, 0, Bounds.Width, Bounds.Height);
        context.Custom(new TacticalDrawOp(bounds, this));
    }

    internal void Draw(SKCanvas canvas, float width, float height)
    {
        DrawBackdrop(canvas, width, height);

        MapSnapshot snapshot = BuildSnapshot();
        _lastSnapshot = snapshot;
        if (snapshot.Positions.Count == 0)
        {
            _hasLiveLayout = false;
            _hoveredSectorNumber = 0;
            _hoveredSectorPopupText = null;
            DrawEmptyState(canvas, width, height);
            return;
        }

        float contentMargin = _viewMode == TacticalMapViewMode.Hex ? HexRadius + 18f : NodeRadius + 12f;
        (float minX, float minY, float maxX, float maxY) = MeasureBounds(snapshot.Positions.Values, contentMargin);
        float contentWidth = Math.Max(1f, maxX - minX);
        float contentHeight = Math.Max(1f, maxY - minY);
        float framePadding = snapshot.Positions.Count > 1
            ? (_viewMode == TacticalMapViewMode.Hex ? 156f : 128f)
            : (_viewMode == TacticalMapViewMode.Hex ? 112f : 92f);
        float scale = Math.Min((width - framePadding) / contentWidth, (height - framePadding) / contentHeight);
        float zoomScale = GetVisualZoomScale();
        scale = Math.Clamp(
            scale * zoomScale,
            _viewMode == TacticalMapViewMode.Hex ? 0.26f : 0.34f,
            _viewMode == TacticalMapViewMode.Hex ? 1.18f : 1.38f);

        _lastRenderScale = scale;
        _lastRenderWidth = width;
        _lastRenderHeight = height;
        _lastWorldCenterX = (minX + maxX) / 2f;
        _lastWorldCenterY = (minY + maxY) / 2f;
        _hasLiveLayout = true;

        canvas.Save();
        canvas.Translate(width / 2f, height / 2f);
        canvas.Scale(scale);
        canvas.Translate(-_lastWorldCenterX, -_lastWorldCenterY);

        if (_viewMode == TacticalMapViewMode.Hex)
            DrawHexCells(canvas, snapshot);
        else
        {
            DrawEdges(canvas, snapshot);
            DrawNodes(canvas, snapshot);
        }

        canvas.Restore();
        RefreshHoverPopup();
        DrawOverlayLegend(canvas, width, height, snapshot, _viewMode);
        DrawSectorHoverPopup(canvas, width, height);
    }

    public void AdjustZoom(float delta)
    {
        SetZoom(_zoomFactor + delta);
    }

    public void ResetZoom()
    {
        SetZoom(DefaultZoomFactor);
    }

    public void SetViewMode(TacticalMapViewMode viewMode)
    {
        if (_viewMode == viewMode)
            return;

        _viewMode = viewMode;
        InvalidateVisual();
        ViewModeChanged?.Invoke(this);
    }

    public void CenterOnSector(int sectorNumber)
    {
        if (sectorNumber <= 0)
            return;

        _centerSectorOverride = sectorNumber;
        InvalidateVisual();
    }

    public void FollowLiveSector()
    {
        if (_centerSectorOverride == null)
            return;

        _centerSectorOverride = null;
        InvalidateVisual();
    }

    public void SetPreviewSelection(
        IEnumerable<int>? highlightedSectors,
        int gateSector = 0,
        int surroundingDepth = 0,
        string? legendText = null,
        bool limitHighlightedSectors = true,
        bool zoomControlsDepth = false)
    {
        _previewHighlightedSectors = highlightedSectors?
            .Where(sectorNumber => sectorNumber > 0)
            .ToHashSet()
            ?? [];
        _previewGateSector = gateSector > 0 ? gateSector : 0;
        _previewSurroundingDepth = Math.Max(0, surroundingDepth);
        _previewLegendText = string.IsNullOrWhiteSpace(legendText) ? null : legendText.Trim();
        _previewLimitHighlightedSectors = limitHighlightedSectors;
        _previewZoomControlsDepth = zoomControlsDepth && _previewHighlightedSectors.Count > 0;
        InvalidateVisual();
    }

    private void SetZoom(float zoomFactor)
    {
        float clamped = Math.Clamp(zoomFactor, MinZoomFactor, MaxZoomFactor);
        if (Math.Abs(clamped - _zoomFactor) < 0.001f)
            return;

        _zoomFactor = clamped;
        InvalidateVisual();
        ZoomChanged?.Invoke(this);
    }

    private void OnPointerWheelChanged(object? sender, PointerWheelEventArgs e)
    {
        if (e.Delta.Y > 0)
            AdjustZoom(ZoomStep);
        else if (e.Delta.Y < 0)
            AdjustZoom(-ZoomStep);
        else
            return;

        e.Handled = true;
    }

    private void OnPointerMoved(object? sender, PointerEventArgs e)
    {
        Point pointerPosition = e.GetPosition(this);
        bool changed = UpdateHoveredSector(pointerPosition);
        if (changed)
            InvalidateVisual();
    }

    private void OnPointerExited(object? sender, PointerEventArgs e)
    {
        if (_hoveredSectorNumber == 0 && _hoveredSectorPopupText == null)
            return;

        _hoveredSectorNumber = 0;
        _hoveredSectorPopupText = null;
        InvalidateVisual();
    }

    private void OnDoubleTapped(object? sender, TappedEventArgs e)
    {
        int sectorNumber = HitTestSector(e.GetPosition(this));
        if (sectorNumber <= 0)
            return;

        SectorDoubleClicked?.Invoke(this, sectorNumber);
        e.Handled = true;
    }

    private bool UpdateHoveredSector(Point pointerPosition)
    {
        int hoveredSector = HitTestSector(pointerPosition);
        bool sectorChanged = hoveredSector != _hoveredSectorNumber;
        bool pointChanged = !_hoverPoint.Equals(pointerPosition);
        _hoverPoint = pointerPosition;

        if (!sectorChanged && !pointChanged)
            return false;

        _hoveredSectorNumber = hoveredSector;
        _hoveredSectorPopupText = hoveredSector > 0 ? BuildSectorPopupText(hoveredSector) : null;
        return true;
    }

    private int HitTestSector(Point pointerPosition)
    {
        if (!_hasLiveLayout || _lastRenderScale <= 0f || _lastSnapshot.Positions.Count == 0)
            return 0;

        SKPoint worldPoint = ScreenToWorld(pointerPosition);
        if (_viewMode == TacticalMapViewMode.Hex)
        {
            foreach ((int sectorNumber, SKPoint center) in _lastSnapshot.Positions)
            {
                if (IsPointInHex(worldPoint, center, HexRadius))
                    return sectorNumber;
            }

            return 0;
        }

        int closestSector = 0;
        float closestDistance = float.MaxValue;
        foreach ((int sectorNumber, SKPoint center) in _lastSnapshot.Positions)
        {
            float distance = Dist(center, worldPoint);
            if (distance > NodeRadius + 10f || distance >= closestDistance)
                continue;

            closestDistance = distance;
            closestSector = sectorNumber;
        }

        return closestSector;
    }

    private SKPoint ScreenToWorld(Point pointerPosition)
    {
        return new SKPoint(
            ((float)pointerPosition.X - (_lastRenderWidth / 2f)) / _lastRenderScale + _lastWorldCenterX,
            ((float)pointerPosition.Y - (_lastRenderHeight / 2f)) / _lastRenderScale + _lastWorldCenterY);
    }

    private void RefreshHoverPopup()
    {
        if (_hoveredSectorNumber <= 0)
            return;

        if (!_lastSnapshot.Positions.ContainsKey(_hoveredSectorNumber))
        {
            _hoveredSectorNumber = 0;
            _hoveredSectorPopupText = null;
            return;
        }

        _hoveredSectorPopupText = BuildSectorPopupText(_hoveredSectorNumber);
    }

    private string BuildSectorPopupText(int sectorNumber)
    {
        Core.ModDatabase? db = _getDb();
        Core.SectorData? sector = db?.GetSector(sectorNumber);
        if (sector == null)
            _lastSnapshot.Sectors.TryGetValue(sectorNumber, out sector);

        return SectorScanFormatter.FormatSectorTooltip(sectorNumber, sector, db);
    }

    private void DrawBackdrop(SKCanvas canvas, float width, float height)
    {
        using var bgShader = SKShader.CreateLinearGradient(
            new SKPoint(0, 0),
            new SKPoint(width, height),
            [
                new SKColor(0x04, 0x0c, 0x12),
                new SKColor(0x0b, 0x1b, 0x24),
                new SKColor(0x05, 0x12, 0x18),
            ],
            null,
            SKShaderTileMode.Clamp);
        using var bgPaint = new SKPaint { Shader = bgShader, Style = SKPaintStyle.Fill };
        canvas.DrawRect(0, 0, width, height, bgPaint);

        using var glow = new SKPaint
        {
            IsAntialias = true,
            Shader = SKShader.CreateRadialGradient(
                new SKPoint(width * 0.28f, height * 0.62f),
                Math.Max(width, height) * 0.45f,
                [
                    new SKColor(0x00, 0xc4, 0xc1, 45),
                    new SKColor(0x00, 0xc4, 0xc1, 0),
                ],
                null,
                SKShaderTileMode.Clamp),
        };
        canvas.DrawRect(0, 0, width, height, glow);

        using var gridPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            Color = new SKColor(0x2b, 0x60, 0x69, 36),
            StrokeWidth = 1f,
        };

        float spacing = 48f;
        for (float x = spacing; x < width; x += spacing)
            canvas.DrawLine(x, 0, x, height, gridPaint);
        for (float y = spacing; y < height; y += spacing)
            canvas.DrawLine(0, y, width, y, gridPaint);

        using var ringPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            Color = new SKColor(0x8e, 0xd8, 0xd8, 26),
            StrokeWidth = 1.2f,
        };
        var center = new SKPoint(width * 0.5f, height * 0.56f);
        for (float radius = 58f; radius < Math.Max(width, height) * 0.48f; radius += 54f)
            canvas.DrawCircle(center, radius, ringPaint);

        using var starPaint = new SKPaint { IsAntialias = true };
        foreach (var star in _stars)
        {
            starPaint.Color = new SKColor(0xd6, 0xf5, 0xff, star.Alpha);
            canvas.DrawCircle(star.X * width, star.Y * height, star.Size, starPaint);
        }
    }

    private static void DrawEmptyState(SKCanvas canvas, float width, float height)
    {
        using var titlePaint = new SKPaint
        {
            IsAntialias = true,
            Color = new SKColor(0x9c, 0xc6, 0xcf),
            TextSize = 18f,
            TextAlign = SKTextAlign.Center,
            Typeface = SKTypeface.Default,
        };
        using var bodyPaint = new SKPaint
        {
            IsAntialias = true,
            Color = new SKColor(0x6f, 0x95, 0x9d),
            TextSize = 13f,
            TextAlign = SKTextAlign.Center,
            Typeface = SKTypeface.Default,
        };

        canvas.DrawText("Awaiting sector telemetry", width / 2f, height / 2f - 10f, titlePaint);
        canvas.DrawText("Connect to a game to populate the tactical overlay.", width / 2f, height / 2f + 18f, bodyPaint);
    }

    private static void DrawEdges(SKCanvas canvas, MapSnapshot snapshot)
    {
        using var linkGlow = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            Color = new SKColor(0x00, 0xe8, 0xe0, 24),
            StrokeWidth = 7f,
        };
        using var linkPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            Color = new SKColor(0x62, 0xbd, 0xc7, 150),
            StrokeWidth = 2f,
        };
        using var oneWayPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            Color = new SKColor(0x6c, 0x8a, 0x98, 110),
            StrokeWidth = 1.4f,
            PathEffect = SKPathEffect.CreateDash([6f, 6f], 0),
        };
        using var majorLaneGlow = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            Color = new SKColor(0x33, 0x99, 0xff, 44),
            StrokeWidth = 8f,
        };
        using var majorLanePaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            Color = new SKColor(0x33, 0x99, 0xff, 210),
            StrokeWidth = 2.5f,
        };

        var drawnEdges = new HashSet<(int A, int B)>();
        foreach ((int sectorNumber, SKPoint position) in snapshot.Positions)
        {
            if (!snapshot.Sectors.TryGetValue(sectorNumber, out Core.SectorData? sector) || sector == null)
                continue;

            foreach (int targetSector in EnumerateLinkedSectors(sector).Where(targetSector => snapshot.Positions.ContainsKey(targetSector)))
            {
                int a = Math.Min(sectorNumber, targetSector);
                int b = Math.Max(sectorNumber, targetSector);
                if (!drawnEdges.Add((a, b)))
                    continue;

                snapshot.Sectors.TryGetValue(targetSector, out Core.SectorData? target);
                bool forward = HasOutgoingWarp(sector, targetSector);
                bool backward = HasOutgoingWarp(target, sectorNumber);
                bool twoWay = forward && backward;
                bool highlightedEdge = snapshot.HighlightedSectors.Contains(sectorNumber) &&
                                       snapshot.HighlightedSectors.Contains(targetSector);
                bool gateEdge = snapshot.GateSector > 0 &&
                                ((sectorNumber == snapshot.GateSector && snapshot.HighlightedSectors.Contains(targetSector)) ||
                                 (targetSector == snapshot.GateSector && snapshot.HighlightedSectors.Contains(sectorNumber)));
                bool majorLaneEdge = !snapshot.IsPreview &&
                                     snapshot.MajorSpaceLaneSectors.Contains(sectorNumber) &&
                                     snapshot.MajorSpaceLaneSectors.Contains(targetSector);

                SKPoint start = position;
                SKPoint end = snapshot.Positions[targetSector];
                if (snapshot.IsPreview)
                {
                    if (highlightedEdge)
                    {
                        linkGlow.Color = new SKColor(0xff, 0x4f, 0xd8, 42);
                        linkPaint.Color = new SKColor(0xff, 0x4f, 0xd8, 210);
                    }
                    else if (gateEdge)
                    {
                        linkGlow.Color = new SKColor(0x44, 0xed, 0xf0, 36);
                        linkPaint.Color = new SKColor(0x44, 0xed, 0xf0, 210);
                    }
                    else
                    {
                        linkGlow.Color = new SKColor(0x7e, 0x8f, 0x98, 14);
                        linkPaint.Color = new SKColor(0xa0, 0xae, 0xb4, 78);
                    }
                }

                canvas.DrawLine(start, end, majorLaneEdge ? majorLaneGlow : linkGlow);
                canvas.DrawLine(start, end, majorLaneEdge ? majorLanePaint : twoWay ? linkPaint : oneWayPaint);
            }
        }
    }

    private static void DrawNodes(SKCanvas canvas, MapSnapshot snapshot)
    {
        using var nodeFill = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Fill };
        using var nodeGlow = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Fill };
        using var ringPaint = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeWidth = 2f };
        using var textPaint = new SKPaint
        {
            IsAntialias = true,
            TextSize = 12f,
            TextAlign = SKTextAlign.Center,
            Typeface = SKTypeface.Default,
        };
        using var smallPaint = new SKPaint
        {
            IsAntialias = true,
            TextSize = 9f,
            TextAlign = SKTextAlign.Center,
            Typeface = SKTypeface.Default,
        };

        foreach ((int sectorNumber, SKPoint position) in snapshot.Positions.OrderBy(kvp => snapshot.Depths.GetValueOrDefault(kvp.Key)))
        {
            snapshot.Sectors.TryGetValue(sectorNumber, out Core.SectorData? sector);

            if (snapshot.IsPreview)
            {
                bool isGate = sectorNumber == snapshot.GateSector;
                bool isHighlighted = snapshot.HighlightedSectors.Contains(sectorNumber);
                SKColor previewFillColor = isGate
                    ? new SKColor(0x12, 0x94, 0xa1)
                    : isHighlighted
                        ? new SKColor(0xc9, 0x2f, 0xd5)
                        : new SKColor(0x53, 0x5d, 0x63);

                nodeGlow.Color = previewFillColor.WithAlpha((byte)(isHighlighted || isGate ? 78 : 24));
                canvas.DrawCircle(position, isHighlighted || isGate ? NodeRadius + 8f : NodeRadius + 5f, nodeGlow);

                nodeFill.Color = previewFillColor;
                canvas.DrawCircle(position, isHighlighted || isGate ? NodeRadius + 1.5f : NodeRadius - 1f, nodeFill);

                ringPaint.Color = isGate
                    ? new SKColor(0x85, 0xff, 0xff)
                    : isHighlighted
                        ? new SKColor(0xff, 0xb6, 0xfd)
                        : new SKColor(0xc9, 0xd1, 0xd6);
                canvas.DrawCircle(position, isHighlighted || isGate ? NodeRadius + 3.5f : NodeRadius + 0.5f, ringPaint);
                if (snapshot.OwnershipOverlays.TryGetValue(sectorNumber, out SectorOwnershipOverlay previewOverlay))
                    DrawCircularOwnershipRings(canvas, ringPaint, position, isHighlighted || isGate ? NodeRadius + 3.5f : NodeRadius + 0.5f, previewOverlay);

                bool showPreviewLabel = isHighlighted ||
                                        isGate ||
                                        snapshot.Positions.Count <= 90 ||
                                        snapshot.Depths.GetValueOrDefault(sectorNumber) <= 1;
                if (showPreviewLabel)
                {
                    textPaint.Color = SKColors.White;
                    canvas.DrawText(sectorNumber.ToString(), position.X, position.Y + 4f, textPaint);
                }
                continue;
            }

            bool isCurrent = sectorNumber == snapshot.CurrentSector;
            bool isLandmark = snapshot.Landmarks.Contains(sectorNumber);
            bool isMajorLane = snapshot.MajorSpaceLaneSectors.Contains(sectorNumber);
            SKColor fillColor = isCurrent
                ? new SKColor(0xff, 0xc0, 0x54)
                : isLandmark
                    ? new SKColor(0x52, 0xa4, 0xff)
                    : isMajorLane
                        ? new SKColor(0x33, 0x99, 0xff)
                    : sector?.Explored == Core.ExploreType.Yes
                        ? new SKColor(0x00, 0xd9, 0xd0)
                        : sector?.Explored == Core.ExploreType.Density
                            ? new SKColor(0x2b, 0x8e, 0x9d)
                            : new SKColor(0x3a, 0x4d, 0x57);

            nodeGlow.Color = fillColor.WithAlpha((byte)(isCurrent ? 90 : 42));
            canvas.DrawCircle(position, isCurrent ? NodeRadius + 10f : NodeRadius + 6f, nodeGlow);

            nodeFill.Color = fillColor;
            canvas.DrawCircle(position, isCurrent ? NodeRadius + 2f : NodeRadius, nodeFill);

            ringPaint.Color = isCurrent
                ? new SKColor(0xff, 0xe8, 0xa4)
                : isLandmark
                    ? new SKColor(0x8a, 0xc6, 0xff)
                    : isMajorLane
                        ? new SKColor(0x9d, 0xcf, 0xff)
                    : new SKColor(0x73, 0xd4, 0xd9);
            canvas.DrawCircle(position, isCurrent ? NodeRadius + 4f : NodeRadius + 1.5f, ringPaint);
            if (snapshot.OwnershipOverlays.TryGetValue(sectorNumber, out SectorOwnershipOverlay overlay))
                DrawCircularOwnershipRings(canvas, ringPaint, position, isCurrent ? NodeRadius + 4f : NodeRadius + 1.5f, overlay);

            textPaint.Color = fillColor.Red > 200 && fillColor.Green > 160
                ? new SKColor(0x0d, 0x18, 0x1f)
                : SKColors.White;
            canvas.DrawText(sectorNumber.ToString(), position.X, position.Y + 4f, textPaint);

            if (sector?.SectorPort != null && !sector.SectorPort.Dead)
            {
                smallPaint.Color = new SKColor(0x0d, 0x18, 0x1f);
                canvas.DrawCircle(position.X + NodeRadius - 4f, position.Y - NodeRadius + 4f, 5.5f, nodeFill);
                smallPaint.Color = new SKColor(0xff, 0xff, 0xff);
                canvas.DrawText("P", position.X + NodeRadius - 4f, position.Y - NodeRadius + 7f, smallPaint);
            }
        }
    }

    private static void DrawHexCells(SKCanvas canvas, MapSnapshot snapshot)
    {
        using var fillPaint = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Fill };
        using var edgeGlow = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeWidth = 7f };
        using var edgePaint = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeWidth = 2.4f };
        using var ringPaint = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeWidth = 2f };
        using var sectorPaint = new SKPaint
        {
            IsAntialias = true,
            TextSize = 13f,
            TextAlign = SKTextAlign.Center,
            Typeface = SKTypeface.Default,
        };
        using var portPaint = new SKPaint
        {
            IsAntialias = true,
            TextSize = 10f,
            TextAlign = SKTextAlign.Center,
            Typeface = SKTypeface.Default,
        };

        foreach ((int sectorNumber, SKPoint position) in snapshot.Positions.OrderBy(kvp => snapshot.Depths.GetValueOrDefault(kvp.Key)))
        {
            snapshot.Sectors.TryGetValue(sectorNumber, out Core.SectorData? sector);
            var palette = GetHexPalette(snapshot, sectorNumber, sector);
            using SKPath hexPath = CreateHexPath(position, HexRadius);

            fillPaint.Color = palette.Fill;
            canvas.DrawPath(hexPath, fillPaint);

            edgeGlow.Color = palette.Edge.WithAlpha((byte)(sectorNumber == snapshot.CurrentSector ? 72 : 34));
            edgePaint.Color = palette.Edge;
            canvas.DrawPath(hexPath, edgeGlow);
            canvas.DrawPath(hexPath, edgePaint);
            if (snapshot.OwnershipOverlays.TryGetValue(sectorNumber, out SectorOwnershipOverlay overlay))
                DrawHexOwnershipRings(canvas, ringPaint, position, HexRadius + 1.5f, overlay);

            string portLabel = GetPortTypeLabel(sector);
            sectorPaint.Color = palette.Text;
            portPaint.Color = palette.PortText;
            float sectorY = string.IsNullOrEmpty(portLabel) ? position.Y + 4f : position.Y - 4f;
            canvas.DrawText(sectorNumber.ToString(), position.X, sectorY, sectorPaint);
            if (!string.IsNullOrEmpty(portLabel))
                canvas.DrawText(portLabel, position.X, position.Y + 14f, portPaint);
        }
    }

    private void DrawSectorHoverPopup(SKCanvas canvas, float width, float height)
    {
        if (_hoveredSectorNumber <= 0 || string.IsNullOrWhiteSpace(_hoveredSectorPopupText))
            return;

        string[] lines = _hoveredSectorPopupText
            .Replace("\r", string.Empty, StringComparison.Ordinal)
            .Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length == 0)
            return;

        using var shadowPaint = new SKPaint
        {
            IsAntialias = true,
            Color = new SKColor(0x00, 0x00, 0x00, 96),
            ImageFilter = SKImageFilter.CreateBlur(10f, 10f),
        };
        using var fillPaint = new SKPaint
        {
            IsAntialias = true,
            Color = new SKColor(0x05, 0x0f, 0x14, 242),
            Style = SKPaintStyle.Fill,
        };
        using var borderPaint = new SKPaint
        {
            IsAntialias = true,
            Color = new SKColor(0x18, 0xd6, 0xd1, 220),
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 1.5f,
        };
        using var textPaint = new SKPaint
        {
            IsAntialias = true,
            Color = new SKColor(0xe2, 0xfb, 0xff),
            TextSize = 13f,
            Typeface = PopupTypeface,
        };

        SKFontMetrics metrics = textPaint.FontMetrics;
        float lineHeight = metrics.Descent - metrics.Ascent + 2f;
        float textWidth = lines.Max(textPaint.MeasureText);
        float popupWidth = MathF.Min(width - 16f, textWidth + 24f);
        float popupHeight = MathF.Min(height - 16f, (lines.Length * lineHeight) + 18f);

        float x = (float)_hoverPoint.X + 18f;
        float y = (float)_hoverPoint.Y + 18f;
        if (x + popupWidth > width - 8f)
            x = Math.Max(8f, (float)_hoverPoint.X - popupWidth - 18f);
        if (y + popupHeight > height - 8f)
            y = Math.Max(8f, height - popupHeight - 8f);

        var popupRect = new SKRect(x, y, x + popupWidth, y + popupHeight);
        canvas.DrawRoundRect(new SKRoundRect(popupRect, 10f, 10f), shadowPaint);
        canvas.DrawRoundRect(new SKRoundRect(popupRect, 10f, 10f), fillPaint);
        canvas.DrawRoundRect(new SKRoundRect(popupRect, 10f, 10f), borderPaint);

        float baseline = y + 10f - metrics.Ascent;
        float maxBaseline = y + popupHeight - 10f;
        foreach (string line in lines)
        {
            if (baseline > maxBaseline)
                break;

            canvas.DrawText(line, x + 12f, baseline, textPaint);
            baseline += lineHeight;
        }
    }

    private static void DrawOverlayLegend(SKCanvas canvas, float width, float height, MapSnapshot snapshot, TacticalMapViewMode viewMode)
    {
        string text = snapshot.IsPreview
            ? !string.IsNullOrWhiteSpace(snapshot.PreviewLegendText)
                ? $"{snapshot.PreviewLegendText}  |  {snapshot.Positions.Count} SECTORS"
                : snapshot.GateSector > 0
                    ? $"PREVIEW DOOR {snapshot.GateSector}  |  {snapshot.HighlightedSectors.Count} / {Math.Max(snapshot.HighlightedSectors.Count, snapshot.TotalHighlightedSectors)} SHOWN"
                    : $"PREVIEW  |  {snapshot.HighlightedSectors.Count} / {Math.Max(snapshot.HighlightedSectors.Count, snapshot.TotalHighlightedSectors)} SHOWN"
            : snapshot.CenterSector > 0
            ? snapshot.CenterSector != snapshot.CurrentSector && snapshot.CurrentSector > 0
                ? $"CENTER {snapshot.CenterSector}  |  LIVE {snapshot.CurrentSector}  |  {GetViewModeLabel(viewMode)} VIEW  |  {snapshot.Positions.Count} SECTORS"
                : $"LIVE SECTOR {snapshot.CenterSector}  |  {GetViewModeLabel(viewMode)} VIEW  |  {snapshot.Positions.Count} SECTORS"
            : "LIVE TACTICAL OVERLAY";

        using var overlayPaint = new SKPaint
        {
            IsAntialias = true,
            Color = new SKColor(0x07, 0x11, 0x18, 185),
            Style = SKPaintStyle.Fill,
        };
        using var textPaint = new SKPaint
        {
            IsAntialias = true,
            Color = new SKColor(0xd6, 0xf6, 0xf4),
            TextSize = 12f,
            Typeface = SKTypeface.Default,
        };

        float overlayRight = snapshot.IsPreview
            ? Math.Min(width - 16f, Math.Max(420f, textPaint.MeasureText(text) + 42f))
            : 326f;
        canvas.DrawRoundRect(new SKRoundRect(new SKRect(16, height - 36, overlayRight, height - 12), 8, 8), overlayPaint);
        canvas.DrawText(text, 28, height - 18, textPaint);
    }

    private MapSnapshot BuildSnapshot()
    {
        var snapshot = new MapSnapshot();
        Core.ModDatabase? db = _getDb();
        int liveSector = Math.Max(1, _getCurrentSector());
        int centerSector = _centerSectorOverride.GetValueOrDefault(liveSector);
        snapshot.CurrentSector = liveSector;
        snapshot.CenterSector = centerSector;

        if (db == null || centerSector <= 0)
            return snapshot;

        if (_previewHighlightedSectors.Count > 0)
        {
            return BuildPreviewSnapshot(db, liveSector, centerSector);
        }

        int visibleDepth = GetVisibleDepth();

        var visited = new Dictionary<int, int> { [centerSector] = 0 };
        var queue = new Queue<int>();
        queue.Enqueue(centerSector);

        while (queue.Count > 0)
        {
            int sectorNumber = queue.Dequeue();
            int depth = visited[sectorNumber];
            Core.SectorData? sector = db.GetSector(sectorNumber);
            snapshot.Sectors[sectorNumber] = sector;

            if (sector == null || depth >= visibleDepth)
                continue;

            foreach (int linkedSector in EnumerateLinkedSectors(sector))
            {
                if (visited.ContainsKey(linkedSector))
                    continue;

                visited[linkedSector] = depth + 1;
                queue.Enqueue(linkedSector);
            }
        }

        foreach (int sectorNumber in visited.Keys.Where(sectorNumber => !snapshot.Sectors.ContainsKey(sectorNumber)))
            snapshot.Sectors[sectorNumber] = db.GetSector(sectorNumber);

        snapshot.Depths = visited;
        foreach (int sectorNumber in GetCachedMajorSpaceLaneSectors(db))
            snapshot.MajorSpaceLaneSectors.Add(sectorNumber);
        if (_viewMode == TacticalMapViewMode.Hex)
            ApplyHexLayout(snapshot, db, centerSector, visited);
        else
            snapshot.Positions = ComputeBubblePositions(db, centerSector, visited);
        PopulateOwnershipOverlays(snapshot, db);

        var header = db.DBHeader;
        AddLandmark(snapshot.Landmarks, header.StarDock);
        AddLandmark(snapshot.Landmarks, header.Rylos);
        AddLandmark(snapshot.Landmarks, header.AlphaCentauri);

        return snapshot;
    }

    private MapSnapshot BuildPreviewSnapshot(Core.ModDatabase db, int liveSector, int fallbackCenterSector)
    {
        int centerSector = _previewGateSector > 0
            ? _previewGateSector
            : _previewHighlightedSectors.FirstOrDefault(fallbackCenterSector);
        if (centerSector <= 0)
            centerSector = fallbackCenterSector;

        var snapshot = new MapSnapshot
        {
            CurrentSector = liveSector,
            CenterSector = centerSector,
            GateSector = _previewGateSector,
            IsPreview = true,
            TotalHighlightedSectors = _previewHighlightedSectors.Count,
            PreviewLegendText = _previewLegendText,
        };

        HashSet<int> previewHighlighted = _previewLimitHighlightedSectors
            ? LimitPreviewHighlightedSectors(
                db,
                centerSector,
                _previewHighlightedSectors,
                PreviewMaxHighlightedSectors)
            : _previewHighlightedSectors
                .Where(sectorNumber => sectorNumber > 0)
                .ToHashSet();

        foreach (int sectorNumber in previewHighlighted)
            snapshot.HighlightedSectors.Add(sectorNumber);

        var includedSectors = new HashSet<int>(snapshot.HighlightedSectors);
        if (_previewGateSector > 0)
        {
            includedSectors.Add(_previewGateSector);
            Core.SectorData? gateSector = db.GetSector(_previewGateSector);
            if (gateSector != null)
            {
                foreach (int linkedSector in EnumerateLinkedSectors(gateSector))
                    includedSectors.Add(linkedSector);
            }
        }

        int previewDepth = GetPreviewSurroundingDepth();
        if (previewDepth > 0)
            ExpandPreviewNeighbors(
                db,
                includedSectors,
                previewDepth,
                _previewZoomControlsDepth ? GetPreviewContextSectorLimit() : int.MaxValue);

        if (includedSectors.Count == 0)
            includedSectors.Add(centerSector);

        foreach (int sectorNumber in includedSectors)
            snapshot.Sectors[sectorNumber] = db.GetSector(sectorNumber);

        snapshot.Depths = BuildPreviewDepths(snapshot.Sectors, centerSector);
        foreach (int sectorNumber in GetCachedMajorSpaceLaneSectors(db))
            snapshot.MajorSpaceLaneSectors.Add(sectorNumber);
        if (_viewMode == TacticalMapViewMode.Hex)
            ApplyHexLayout(snapshot, db, centerSector, snapshot.Depths);
        else
            snapshot.Positions = ComputeBubblePositions(db, centerSector, snapshot.Depths);
        PopulateOwnershipOverlays(snapshot, db);

        return snapshot;
    }

    private void PopulateOwnershipOverlays(MapSnapshot snapshot, Core.ModDatabase db)
    {
        snapshot.OwnershipOverlays.Clear();
        GameState? state = _getState?.Invoke();

        foreach ((int sectorNumber, Core.SectorData? sector) in snapshot.Sectors)
        {
            if (sector == null)
                continue;

            bool friendlyFigs = HasFriendlyFigs(sector, state);
            bool enemyFigs = sector.Fighters.Quantity > 0 &&
                             SectorOwnershipClassifier.IsEnemyOwner(sector.Fighters.Owner, state);
            bool friendlyPlanets = false;
            bool enemyPlanets = false;

            foreach (Core.Planet planet in db.GetPlanetsInSector(sectorNumber))
            {
                if (SectorOwnershipClassifier.IsFriendlyOwner(planet.Owner, state))
                    friendlyPlanets = true;
                else if (SectorOwnershipClassifier.IsEnemyOwner(planet.Owner, state))
                    enemyPlanets = true;

                if ((friendlyFigs || friendlyPlanets) && (enemyFigs || enemyPlanets))
                    break;
            }

            var overlay = new SectorOwnershipOverlay(friendlyFigs, friendlyPlanets, enemyFigs, enemyPlanets);
            if (overlay.HasAny)
                snapshot.OwnershipOverlays[sectorNumber] = overlay;
        }
    }

    private static bool HasFriendlyFigs(Core.SectorData sector, GameState? state)
    {
        if (sector.Fighters.Quantity > 0 &&
            SectorOwnershipClassifier.IsFriendlyOwner(sector.Fighters.Owner, state))
        {
            return true;
        }

        return sector.Variables.TryGetValue("FIGSEC", out string? figMarker) &&
               IsTruthySectorVariable(figMarker);
    }

    private static bool IsTruthySectorVariable(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return !value.Equals("0", StringComparison.OrdinalIgnoreCase) &&
               !value.Equals("false", StringComparison.OrdinalIgnoreCase) &&
               !value.Equals("no", StringComparison.OrdinalIgnoreCase);
    }

    private static HashSet<int> LimitPreviewHighlightedSectors(
        Core.ModDatabase db,
        int centerSector,
        IReadOnlyCollection<int> highlightedSectors,
        int maxHighlightedSectors)
    {
        var highlighted = highlightedSectors
            .Where(sectorNumber => sectorNumber > 0)
            .ToHashSet();
        if (highlighted.Count <= maxHighlightedSectors)
            return highlighted;

        var limited = new HashSet<int>();
        var visited = new HashSet<int>();
        var queue = new Queue<int>();

        if (centerSector > 0)
        {
            visited.Add(centerSector);
            queue.Enqueue(centerSector);
        }

        while (queue.Count > 0 && limited.Count < maxHighlightedSectors)
        {
            int sectorNumber = queue.Dequeue();
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null)
                continue;

            foreach (int linkedSector in EnumerateLinkedSectors(sector))
            {
                if (!highlighted.Contains(linkedSector) || !visited.Add(linkedSector))
                    continue;

                limited.Add(linkedSector);
                queue.Enqueue(linkedSector);
                if (limited.Count >= maxHighlightedSectors)
                    break;
            }
        }

        if (limited.Count >= maxHighlightedSectors)
            return limited;

        foreach (int sectorNumber in highlighted.OrderBy(sectorNumber => sectorNumber))
        {
            limited.Add(sectorNumber);
            if (limited.Count >= maxHighlightedSectors)
                break;
        }

        return limited;
    }

    private static Dictionary<int, int> BuildPreviewDepths(
        IReadOnlyDictionary<int, Core.SectorData?> sectors,
        int centerSector)
    {
        var depths = new Dictionary<int, int>();
        if (!sectors.ContainsKey(centerSector))
            return depths;

        var queue = new Queue<int>();
        queue.Enqueue(centerSector);
        depths[centerSector] = 0;

        while (queue.Count > 0)
        {
            int sectorNumber = queue.Dequeue();
            int depth = depths[sectorNumber];
            if (!sectors.TryGetValue(sectorNumber, out Core.SectorData? sector) || sector == null)
                continue;

            foreach (int linkedSector in EnumerateLinkedSectors(sector))
            {
                if (!sectors.ContainsKey(linkedSector) || depths.ContainsKey(linkedSector))
                    continue;

                depths[linkedSector] = depth + 1;
                queue.Enqueue(linkedSector);
            }
        }

        foreach (int sectorNumber in sectors.Keys)
            depths.TryAdd(sectorNumber, int.MaxValue / 4);

        return depths;
    }

    private static void ExpandPreviewNeighbors(Core.ModDatabase db, HashSet<int> includedSectors, int depth, int maxSectors)
    {
        if (depth <= 0 || includedSectors.Count == 0)
            return;

        if (maxSectors <= 0)
            return;

        var queue = new Queue<(int SectorNumber, int Depth)>();
        var visited = new HashSet<int>(includedSectors);
        foreach (int sectorNumber in includedSectors.OrderBy(sectorNumber => sectorNumber))
            queue.Enqueue((sectorNumber, 0));

        while (queue.Count > 0)
        {
            (int sectorNumber, int currentDepth) = queue.Dequeue();
            if (currentDepth >= depth)
                continue;

            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null)
                continue;

            foreach (int linkedSector in EnumerateLinkedSectors(sector).OrderBy(sectorNumber => sectorNumber))
            {
                if (!visited.Add(linkedSector))
                    continue;

                includedSectors.Add(linkedSector);
                if (includedSectors.Count >= maxSectors)
                    return;

                queue.Enqueue((linkedSector, currentDepth + 1));
            }
        }
    }

    private static Dictionary<int, SKPoint> ComputeBubblePositions(Core.ModDatabase db, int centerSector, Dictionary<int, int> visited)
    {
        var cellOf = new Dictionary<int, (int Col, int Row)> { [centerSector] = (0, 0) };
        var usedCells = new HashSet<(int Col, int Row)> { (0, 0) };
        var placed = new HashSet<int> { centerSector };
        var placeQueue = new Queue<int>();
        placeQueue.Enqueue(centerSector);
        Dictionary<int, int> parentOf = BuildParentMap(db, centerSector, visited);

        (int Col, int Row)[] offsets =
        [
            ( 1,  0), ( 1,  1), ( 0,  1), (-1,  1),
            (-1,  0), (-1, -1), ( 0, -1), ( 1, -1),
        ];

        while (placeQueue.Count > 0)
        {
            int sectorNumber = placeQueue.Dequeue();
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null)
                continue;

            (int col, int row) = cellOf[sectorNumber];

            int desiredCol = 1;
            int desiredRow = 0;
            if (parentOf.TryGetValue(sectorNumber, out int parentSector) && cellOf.TryGetValue(parentSector, out var parentCell))
            {
                desiredCol = col - parentCell.Col;
                desiredRow = row - parentCell.Row;
            }

            float directionLength = MathF.Sqrt(desiredCol * desiredCol + desiredRow * desiredRow);
            float unitCol = directionLength > 0 ? desiredCol / directionLength : 1f;
            float unitRow = directionLength > 0 ? desiredRow / directionLength : 0f;

            var orderedOffsets = offsets
                .OrderBy(offset =>
                {
                    float offsetLength = MathF.Sqrt(offset.Item1 * offset.Item1 + offset.Item2 * offset.Item2);
                    float dot = offsetLength > 0
                        ? (offset.Item1 / offsetLength * unitCol) + (offset.Item2 / offsetLength * unitRow)
                        : 0f;
                    return -dot;
                })
                .ToList();

            foreach (int linkedSector in EnumerateLinkedSectors(sector).Where(linkedSector => visited.ContainsKey(linkedSector) && !placed.Contains(linkedSector)))
            {
                bool assigned = false;
                for (int ring = 1; ring <= 5 && !assigned; ring++)
                {
                    foreach ((int offsetCol, int offsetRow) in orderedOffsets)
                    {
                        var candidate = (col + offsetCol * ring, row + offsetRow * ring);
                        if (usedCells.Contains(candidate))
                            continue;

                        cellOf[linkedSector] = candidate;
                        usedCells.Add(candidate);
                        placed.Add(linkedSector);
                        placeQueue.Enqueue(linkedSector);
                        assigned = true;
                        break;
                    }
                }
            }
        }

        var positions = new Dictionary<int, SKPoint>();
        foreach ((int sectorNumber, (int col, int row)) in cellOf)
            positions[sectorNumber] = new SKPoint(col * BubbleGridX, row * BubbleGridY);

        return positions;
    }

    private static void ApplyHexLayout(MapSnapshot snapshot, Core.ModDatabase db, int centerSector, Dictionary<int, int> visited)
    {
        var cellOf = new Dictionary<int, HexCell> { [centerSector] = new HexCell(0, 0) };
        var sectorByCell = new Dictionary<HexCell, int> { [new HexCell(0, 0)] = centerSector };
        var placed = new HashSet<int> { centerSector };
        var usedCells = new HashSet<HexCell> { new(0, 0) };
        var placeQueue = new Queue<int>();
        placeQueue.Enqueue(centerSector);
        Dictionary<int, int> parentOf = BuildParentMap(db, centerSector, visited);

        while (placeQueue.Count > 0)
        {
            int sectorNumber = placeQueue.Dequeue();
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null)
                continue;

            HexCell origin = cellOf[sectorNumber];
            List<int> orderedDirections = OrderHexDirections(origin, sectorNumber, cellOf, parentOf);

            foreach (int linkedSector in EnumerateLinkedSectors(sector).Where(linkedSector => visited.ContainsKey(linkedSector) && !placed.Contains(linkedSector)))
            {
                if (!TryAssignHexCell(db, linkedSector, origin, orderedDirections, cellOf, usedCells, sectorByCell, out HexCell assignedCell))
                    continue;

                cellOf[linkedSector] = assignedCell;
                sectorByCell[assignedCell] = linkedSector;
                placed.Add(linkedSector);
                placeQueue.Enqueue(linkedSector);
            }
        }

        RefineHexLayout(db, centerSector, visited, cellOf, sectorByCell);
        snapshot.HexCells = cellOf;
        snapshot.SectorByHexCell = sectorByCell;
        snapshot.Positions = cellOf.ToDictionary(kvp => kvp.Key, kvp => HexCellToPoint(kvp.Value));
    }

    private static Dictionary<int, int> BuildParentMap(Core.ModDatabase db, int centerSector, Dictionary<int, int> visited)
    {
        var parentOf = new Dictionary<int, int>();
        var bfs = new Queue<int>();
        var seen = new HashSet<int> { centerSector };
        bfs.Enqueue(centerSector);

        while (bfs.Count > 0)
        {
            int sectorNumber = bfs.Dequeue();
            Core.SectorData? sector = db.GetSector(sectorNumber);
            if (sector == null)
                continue;

            foreach (int linkedSector in EnumerateLinkedSectors(sector).Where(linkedSector => visited.ContainsKey(linkedSector) && !seen.Contains(linkedSector)))
            {
                seen.Add(linkedSector);
                parentOf[linkedSector] = sectorNumber;
                bfs.Enqueue(linkedSector);
            }
        }

        return parentOf;
    }

    private static List<int> OrderHexDirections(HexCell origin, int sectorNumber, Dictionary<int, HexCell> cellOf, Dictionary<int, int> parentOf)
    {
        HexCell desiredDirection = new(1, 0);
        if (parentOf.TryGetValue(sectorNumber, out int parentSector) && cellOf.TryGetValue(parentSector, out HexCell parentCell))
            desiredDirection = new(origin.Q - parentCell.Q, origin.R - parentCell.R);

        return Enumerable.Range(0, HexDirections.Length)
            .OrderByDescending(index => HexDirections[index].Q * desiredDirection.Q + HexDirections[index].R * desiredDirection.R)
            .ThenBy(index => index)
            .ToList();
    }

    private static bool TryAssignHexCell(
        Core.ModDatabase db,
        int sectorNumber,
        HexCell origin,
        IReadOnlyList<int> orderedDirections,
        IReadOnlyDictionary<int, HexCell> cellOf,
        HashSet<HexCell> usedCells,
        IReadOnlyDictionary<HexCell, int> sectorByCell,
        out HexCell assignedCell)
    {
        List<int> connectedPlacedSectors = GetPlacedConnectedSectors(db, sectorNumber, cellOf);
        HexCell bestAdjacentCandidate = default;
        int bestAdjacentScore = int.MinValue;

        foreach (int directionIndex in orderedDirections)
        {
            HexCell direction = HexDirections[directionIndex];
            HexCell candidate = new(origin.Q + direction.Q, origin.R + direction.R);
            if (usedCells.Contains(candidate))
                continue;

            int candidateScore = ScoreHexCandidate(db, sectorNumber, candidate, connectedPlacedSectors, sectorByCell);
            if (candidateScore > bestAdjacentScore)
            {
                bestAdjacentCandidate = candidate;
                bestAdjacentScore = candidateScore;
            }
        }

        if (bestAdjacentScore > int.MinValue)
        {
            usedCells.Add(bestAdjacentCandidate);
            assignedCell = bestAdjacentCandidate;
            return true;
        }

        HexCell bestConnectedCandidate = default;
        int bestConnectedScore = int.MinValue;

        HexCell bestIsolatedCandidate = default;
        int bestIsolatedScore = int.MinValue;

        for (int ring = 2; ring <= 5; ring++)
        {
            foreach (int directionIndex in orderedDirections)
            {
                HexCell direction = HexDirections[directionIndex];
                HexCell candidate = new(origin.Q + direction.Q * ring, origin.R + direction.R * ring);
                if (usedCells.Contains(candidate))
                    continue;

                List<int> occupiedNeighbors = GetAdjacentOccupiedSectors(candidate, sectorByCell);
                bool touchesConnectedSector = false;
                bool touchesUnrelatedSector = false;
                foreach (int neighborSector in occupiedNeighbors)
                {
                    if (!AreSectorsConnected(db, sectorNumber, neighborSector))
                    {
                        touchesUnrelatedSector = true;
                        break;
                    }

                    touchesConnectedSector = true;
                }

                if (touchesUnrelatedSector)
                    continue;

                int candidateScore = ScoreHexCandidate(db, sectorNumber, candidate, connectedPlacedSectors, sectorByCell) - (ring * 120);
                if (touchesConnectedSector)
                {
                    if (candidateScore > bestConnectedScore)
                    {
                        bestConnectedCandidate = candidate;
                        bestConnectedScore = candidateScore;
                    }

                    continue;
                }

                if (occupiedNeighbors.Count == 0 && candidateScore > bestIsolatedScore)
                {
                    bestIsolatedCandidate = candidate;
                    bestIsolatedScore = candidateScore;
                }
            }
        }

        if (bestConnectedScore > int.MinValue)
        {
            usedCells.Add(bestConnectedCandidate);
            assignedCell = bestConnectedCandidate;
            return true;
        }

        if (bestIsolatedScore > int.MinValue)
        {
            usedCells.Add(bestIsolatedCandidate);
            assignedCell = bestIsolatedCandidate;
            return true;
        }

        assignedCell = default;
        return false;
    }

    private static void RefineHexLayout(
        Core.ModDatabase db,
        int centerSector,
        IReadOnlyDictionary<int, int> visited,
        Dictionary<int, HexCell> cellOf,
        Dictionary<HexCell, int> sectorByCell)
    {
        for (int pass = 0; pass < 10; pass++)
        {
            bool movedAny = false;
            foreach (int sectorNumber in cellOf.Keys
                         .OrderByDescending(sectorNumber => visited.GetValueOrDefault(sectorNumber))
                         .ThenBy(sectorNumber => sectorNumber)
                         .ToList())
            {
                if (sectorNumber == centerSector)
                    continue;

                HexCell currentCell = cellOf[sectorNumber];
                List<int> connectedPlacedSectors = GetPlacedConnectedSectors(db, sectorNumber, cellOf);
                if (connectedPlacedSectors.Count == 0)
                    continue;

                sectorByCell.Remove(currentCell);
                HexCell bestCell = currentCell;
                int bestScore = ScoreHexCandidate(db, sectorNumber, currentCell, connectedPlacedSectors, sectorByCell);

                foreach (HexCell candidate in GetRefinementCandidates(currentCell, connectedPlacedSectors, cellOf))
                {
                    if (!candidate.Equals(currentCell) && sectorByCell.ContainsKey(candidate))
                        continue;

                    int candidateScore = ScoreHexCandidate(db, sectorNumber, candidate, connectedPlacedSectors, sectorByCell);
                    if (candidateScore > bestScore)
                    {
                        bestCell = candidate;
                        bestScore = candidateScore;
                    }
                }

                sectorByCell[bestCell] = sectorNumber;
                if (!bestCell.Equals(currentCell))
                {
                    cellOf[sectorNumber] = bestCell;
                    movedAny = true;
                }
            }

            if (!movedAny)
                break;
        }
    }

    private static IEnumerable<int> EnumerateLinkedSectors(Core.SectorData sector)
    {
        return sector.Warp
            .Where(w => w > 0)
            .Select(w => (int)w)
            .Concat(sector.WarpsIn.Where(w => w > 0).Select(w => (int)w))
            .Distinct();
    }

    private static List<int> GetAdjacentOccupiedSectors(HexCell candidate, IReadOnlyDictionary<HexCell, int> sectorByCell)
    {
        var neighbors = new List<int>(HexDirections.Length);
        foreach (HexCell direction in HexDirections)
        {
            HexCell adjacent = new(candidate.Q + direction.Q, candidate.R + direction.R);
            if (sectorByCell.TryGetValue(adjacent, out int sectorNumber))
                neighbors.Add(sectorNumber);
        }

        return neighbors;
    }

    private static List<int> GetPlacedConnectedSectors(
        Core.ModDatabase db,
        int sectorNumber,
        IReadOnlyDictionary<int, HexCell> cellOf)
    {
        var connected = new List<int>();
        foreach (int otherSector in cellOf.Keys)
        {
            if (otherSector != sectorNumber && AreSectorsConnected(db, sectorNumber, otherSector))
                connected.Add(otherSector);
        }

        return connected;
    }

    private static IEnumerable<HexCell> GetRefinementCandidates(
        HexCell currentCell,
        IReadOnlyList<int> connectedPlacedSectors,
        IReadOnlyDictionary<int, HexCell> cellOf)
    {
        var candidates = new HashSet<HexCell> { currentCell };

        foreach (HexCell direction in HexDirections)
            candidates.Add(new HexCell(currentCell.Q + direction.Q, currentCell.R + direction.R));

        foreach (int connectedSector in connectedPlacedSectors)
        {
            if (!cellOf.TryGetValue(connectedSector, out HexCell connectedCell))
                continue;

            candidates.Add(connectedCell);
            foreach (HexCell direction in HexDirections)
                candidates.Add(new HexCell(connectedCell.Q + direction.Q, connectedCell.R + direction.R));
        }

        return candidates;
    }

    private static bool AreSectorsConnected(Core.ModDatabase db, int firstSector, int secondSector)
    {
        if (firstSector == secondSector)
            return true;

        Core.SectorData? first = db.GetSector(firstSector);
        Core.SectorData? second = db.GetSector(secondSector);
        if (first == null || second == null)
            return false;

        return first.Warp.Contains(secondSector)
            || first.WarpsIn.Contains(secondSector)
            || second.Warp.Contains(firstSector)
            || second.WarpsIn.Contains(firstSector);
    }

    private static bool HasOutgoingWarp(Core.SectorData? sector, int targetSector)
        => sector != null && sector.Warp.Contains(targetSector);

    private static int HexDistance(HexCell a, HexCell b)
    {
        int dq = a.Q - b.Q;
        int dr = a.R - b.R;
        int ds = (a.Q + a.R) - (b.Q + b.R);
        return (Math.Abs(dq) + Math.Abs(dr) + Math.Abs(ds)) / 2;
    }

    private int GetVisibleDepth()
    {
        return _zoomFactor switch
        {
            >= 1.55f => 1,
            >= 1.30f => 2,
            >= 1.05f => 3,
            >= 0.80f => 4,
            >= 0.60f => 5,
            _ => ZoomedOutDepth,
        };
    }

    private int GetPreviewSurroundingDepth()
    {
        if (!_previewZoomControlsDepth)
            return _previewSurroundingDepth;

        return Math.Max(_previewSurroundingDepth, GetPreviewZoomDepth());
    }

    private int GetPreviewContextSectorLimit()
    {
        return _zoomFactor switch
        {
            >= 1.30f => 8,
            >= 1.05f => 12,
            >= 0.75f => PreviewDefaultContextSectors,
            >= 0.60f => 32,
            >= 0.50f => 72,
            >= 0.45f => 140,
            _ => PreviewMaxContextSectors,
        };
    }

    private int GetPreviewZoomDepth()
    {
        return _zoomFactor switch
        {
            >= 1.05f => 1,
            >= 0.75f => 2,
            >= 0.60f => 3,
            >= 0.50f => 4,
            _ => 5,
        };
    }

    private float GetVisualZoomScale()
    {
        float normalized = (_zoomFactor - MinZoomFactor) / (MaxZoomFactor - MinZoomFactor);
        normalized = Math.Clamp(normalized, 0f, 1f);
        return _viewMode == TacticalMapViewMode.Hex
            ? 0.55f + (1.35f * MathF.Pow(normalized, 1.25f))
            : 0.48f + (1.7f * MathF.Pow(normalized, 1.35f));
    }

    private static int ScoreHexCandidate(
        Core.ModDatabase db,
        int sectorNumber,
        HexCell candidate,
        IReadOnlyList<int> connectedPlacedSectors,
        IReadOnlyDictionary<HexCell, int> sectorByCell)
    {
        int adjacentConnected = 0;
        int adjacentUnrelated = 0;
        foreach (int neighborSector in GetAdjacentOccupiedSectors(candidate, sectorByCell))
        {
            if (AreSectorsConnected(db, sectorNumber, neighborSector))
                adjacentConnected++;
            else
                adjacentUnrelated++;
        }

        int totalDistance = 0;
        foreach (int connectedSector in connectedPlacedSectors)
        {
            if (!TryGetSectorCell(sectorByCell, connectedSector, out HexCell connectedCell))
                continue;

            totalDistance += HexDistance(candidate, connectedCell);
        }

        int centerDistance = HexDistance(candidate, new HexCell(0, 0));
        return (adjacentConnected * 220)
             - (adjacentUnrelated * 140)
             - (totalDistance * 16)
             - centerDistance;
    }

    private static bool TryGetSectorCell(IReadOnlyDictionary<HexCell, int> sectorByCell, int sectorNumber, out HexCell cell)
    {
        foreach ((HexCell candidate, int occupant) in sectorByCell)
        {
            if (occupant == sectorNumber)
            {
                cell = candidate;
                return true;
            }
        }

        cell = default;
        return false;
    }

    private static (float MinX, float MinY, float MaxX, float MaxY) MeasureBounds(IEnumerable<SKPoint> points, float margin)
    {
        float minX = float.MaxValue;
        float minY = float.MaxValue;
        float maxX = float.MinValue;
        float maxY = float.MinValue;

        foreach (SKPoint point in points)
        {
            minX = Math.Min(minX, point.X);
            minY = Math.Min(minY, point.Y);
            maxX = Math.Max(maxX, point.X);
            maxY = Math.Max(maxY, point.Y);
        }

        return (minX - margin, minY - margin, maxX + margin, maxY + margin);
    }

    private static void AddLandmark(HashSet<int> landmarks, int sectorNumber)
    {
        if (sectorNumber > 0 && sectorNumber != 65535)
            landmarks.Add(sectorNumber);
    }

    private static SKPoint HexCellToPoint(HexCell cell)
    {
        float stepX = HexRadius * 1.7320508f * HexGapFactor;
        float stepY = HexRadius * 1.5f * HexGapFactor;
        return new SKPoint(
            stepX * (cell.Q + cell.R * 0.5f),
            stepY * cell.R);
    }

    private static SKPath CreateHexPath(SKPoint center, float radius)
    {
        SKPoint[] vertices = GetHexVertices(center, radius);
        var path = new SKPath();
        path.MoveTo(vertices[0]);
        for (int index = 1; index < vertices.Length; index++)
            path.LineTo(vertices[index]);
        path.Close();
        return path;
    }

    private static SKPoint[] GetHexVertices(SKPoint center, float radius)
    {
        var vertices = new SKPoint[6];
        for (int index = 0; index < 6; index++)
        {
            float angleDegrees = -90f + (60f * index);
            float angle = angleDegrees * MathF.PI / 180f;
            vertices[index] = new SKPoint(
                center.X + MathF.Cos(angle) * radius,
                center.Y + MathF.Sin(angle) * radius);
        }

        return vertices;
    }

    private static bool IsPointInHex(SKPoint point, SKPoint center, float radius)
    {
        SKPoint[] vertices = GetHexVertices(center, radius);
        bool inside = false;
        for (int index = 0, previous = vertices.Length - 1; index < vertices.Length; previous = index++)
        {
            SKPoint current = vertices[index];
            SKPoint prior = vertices[previous];
            bool intersects = ((current.Y > point.Y) != (prior.Y > point.Y)) &&
                              (point.X < ((prior.X - current.X) * (point.Y - current.Y) / ((prior.Y - current.Y) + float.Epsilon)) + current.X);
            if (intersects)
                inside = !inside;
        }

        return inside;
    }

    private static float Dist(SKPoint a, SKPoint b)
    {
        float dx = a.X - b.X;
        float dy = a.Y - b.Y;
        return MathF.Sqrt((dx * dx) + (dy * dy));
    }

    private static void DrawCircularOwnershipRings(
        SKCanvas canvas,
        SKPaint ringPaint,
        SKPoint position,
        float baseRadius,
        SectorOwnershipOverlay overlay)
    {
        float nextRadius = baseRadius + 4.5f;
        DrawOwnershipRings(
            drawRadius => canvas.DrawCircle(position, drawRadius, ringPaint),
            ringPaint,
            ref nextRadius,
            overlay);
    }

    private static void DrawHexOwnershipRings(
        SKCanvas canvas,
        SKPaint ringPaint,
        SKPoint position,
        float baseRadius,
        SectorOwnershipOverlay overlay)
    {
        float nextRadius = baseRadius + 4.5f;
        DrawOwnershipRings(
            drawRadius =>
            {
                using SKPath hexPath = CreateHexPath(position, drawRadius);
                canvas.DrawPath(hexPath, ringPaint);
            },
            ringPaint,
            ref nextRadius,
            overlay);
    }

    private static void DrawOwnershipRings(
        Action<float> drawRing,
        SKPaint ringPaint,
        ref float nextRadius,
        SectorOwnershipOverlay overlay)
    {
        for (int index = 0; index < overlay.FriendlyRingCount; index++)
        {
            ringPaint.Color = index == 0
                ? new SKColor(0x29, 0xf7, 0x57)
                : new SKColor(0x94, 0xff, 0xb0);
            drawRing(nextRadius);
            nextRadius += 4f;
        }

        for (int index = 0; index < overlay.EnemyRingCount; index++)
        {
            ringPaint.Color = index == 0
                ? new SKColor(0xff, 0x5f, 0x5f)
                : new SKColor(0xff, 0xa0, 0xa0);
            drawRing(nextRadius);
            nextRadius += 4f;
        }
    }

    private static SKTypeface CreatePopupTypeface()
    {
        if (OperatingSystem.IsMacOS())
            return SKTypeface.FromFamilyName("Menlo");
        if (OperatingSystem.IsWindows())
            return SKTypeface.FromFamilyName("Consolas");
        return SKTypeface.FromFamilyName("DejaVu Sans Mono");
    }

    private static (SKColor Fill, SKColor Edge, SKColor Text, SKColor PortText) GetHexPalette(MapSnapshot snapshot, int sectorNumber, Core.SectorData? sector)
    {
        if (snapshot.IsPreview)
        {
            if (sectorNumber == snapshot.GateSector)
            {
                return (
                    new SKColor(0x0f, 0x3d, 0x44, 210),
                    new SKColor(0x58, 0xf5, 0xf0),
                    new SKColor(0xe9, 0xff, 0xff),
                    new SKColor(0xb0, 0xff, 0xff));
            }

            if (snapshot.HighlightedSectors.Contains(sectorNumber))
            {
                return (
                    new SKColor(0x38, 0x12, 0x3c, 210),
                    new SKColor(0xff, 0x57, 0xee),
                    new SKColor(0xff, 0xec, 0xff),
                    new SKColor(0xff, 0xb8, 0xfa));
            }

            return (
                new SKColor(0x20, 0x23, 0x28, 190),
                new SKColor(0xb8, 0xc0, 0xc5),
                new SKColor(0xf0, 0xf3, 0xf5),
                new SKColor(0xd9, 0xe1, 0xe5));
        }

        bool isCurrent = sectorNumber == snapshot.CurrentSector;
        bool isLandmark = snapshot.Landmarks.Contains(sectorNumber);
        if (isCurrent)
        {
            return (
                new SKColor(0x5b, 0x3c, 0x12, 210),
                new SKColor(0xff, 0xc0, 0x54),
                new SKColor(0xff, 0xf2, 0xc7),
                new SKColor(0xff, 0xda, 0x7c));
        }

        if (isLandmark)
        {
            return (
                new SKColor(0x14, 0x28, 0x34, 190),
                new SKColor(0x58, 0xc1, 0xf7),
                new SKColor(0xe8, 0xf7, 0xff),
                new SKColor(0x9f, 0xdd, 0xff));
        }

        if (snapshot.MajorSpaceLaneSectors.Contains(sectorNumber))
        {
            return (
                new SKColor(0x0e, 0x20, 0x3a, 205),
                new SKColor(0x33, 0x99, 0xff),
                new SKColor(0xe9, 0xf5, 0xff),
                new SKColor(0xa8, 0xd2, 0xff));
        }

        return sector?.Explored switch
        {
            Core.ExploreType.Yes => (
                new SKColor(0x0e, 0x1c, 0x14, 190),
                new SKColor(0x19, 0xcc, 0x3b),
                new SKColor(0xdb, 0xff, 0xe2),
                new SKColor(0x8a, 0xf6, 0xa1)),
            Core.ExploreType.Density => (
                new SKColor(0x12, 0x1d, 0x22, 190),
                new SKColor(0x2c, 0xc7, 0xd9),
                new SKColor(0xd9, 0xf9, 0xff),
                new SKColor(0x8f, 0xeb, 0xff)),
            _ => (
                new SKColor(0x18, 0x0e, 0x20, 190),
                new SKColor(0xb2, 0x29, 0xcf),
                new SKColor(0xf4, 0xe8, 0xfa),
                new SKColor(0xd7, 0x92, 0xe6)),
        };
    }

    private static string GetPortTypeLabel(Core.SectorData? sector)
    {
        if (sector?.SectorPort == null || sector.SectorPort.Dead)
            return string.Empty;

        Core.Port port = sector.SectorPort;
        if (port.ClassIndex == 9)
            return "SD";

        if (port.ClassIndex == 0 && !string.IsNullOrWhiteSpace(port.Name))
        {
            if (string.Equals(port.Name, "Rylos", StringComparison.OrdinalIgnoreCase))
                return "RY";
            if (string.Equals(port.Name, "Alpha Centauri", StringComparison.OrdinalIgnoreCase))
                return "AC";
            if (string.Equals(port.Name, "Sol", StringComparison.OrdinalIgnoreCase))
                return "SOL";
        }

        bool hasFuel = port.BuyProduct.TryGetValue(Core.ProductType.FuelOre, out bool buyFuel);
        bool hasOrg = port.BuyProduct.TryGetValue(Core.ProductType.Organics, out bool buyOrg);
        bool hasEquip = port.BuyProduct.TryGetValue(Core.ProductType.Equipment, out bool buyEquip);
        if (hasFuel || hasOrg || hasEquip)
        {
            char fuel = hasFuel && buyFuel ? 'B' : 'S';
            char org = hasOrg && buyOrg ? 'B' : 'S';
            char equip = hasEquip && buyEquip ? 'B' : 'S';
            return new string([fuel, org, equip]);
        }

        return port.ClassIndex > 0 ? $"C{port.ClassIndex}" : "PORT";
    }

    private HashSet<int> GetCachedMajorSpaceLaneSectors(Core.ModDatabase db)
    {
        long changeStamp = db.ChangeStamp;
        if (ReferenceEquals(_majorSpaceLaneDb, db) && _majorSpaceLaneChangeStamp == changeStamp)
            return _majorSpaceLaneSectors;

        _majorSpaceLaneDb = db;
        _majorSpaceLaneChangeStamp = changeStamp;
        _majorSpaceLaneSectors = db.GetMajorSpaceLaneSectors();
        return _majorSpaceLaneSectors;
    }

    private readonly record struct HexCell(int Q, int R);

    private sealed class MapSnapshot
    {
        public int CurrentSector { get; set; }
        public int CenterSector { get; set; }
        public int GateSector { get; set; }
        public bool IsPreview { get; set; }
        public int TotalHighlightedSectors { get; set; }
        public string? PreviewLegendText { get; set; }
        public Dictionary<int, SKPoint> Positions { get; set; } = new();
        public Dictionary<int, Core.SectorData?> Sectors { get; set; } = new();
        public Dictionary<int, int> Depths { get; set; } = new();
        public Dictionary<int, HexCell> HexCells { get; set; } = new();
        public Dictionary<HexCell, int> SectorByHexCell { get; set; } = new();
        public Dictionary<int, SectorOwnershipOverlay> OwnershipOverlays { get; } = [];
        public HashSet<int> HighlightedSectors { get; } = [];
        public HashSet<int> Landmarks { get; } = [];
        public HashSet<int> MajorSpaceLaneSectors { get; } = [];
    }

    private readonly record struct SectorOwnershipOverlay(
        bool FriendlyFigs,
        bool FriendlyPlanets,
        bool EnemyFigs,
        bool EnemyPlanets)
    {
        public int FriendlyRingCount => FriendlyPlanets ? 2 : FriendlyFigs ? 1 : 0;
        public int EnemyRingCount => EnemyPlanets ? 2 : EnemyFigs ? 1 : 0;
        public bool HasAny => FriendlyRingCount > 0 || EnemyRingCount > 0;
    }

    private sealed class TacticalDrawOp(Rect bounds, TacticalMapControl owner) : ICustomDrawOperation
    {
        public Rect Bounds => bounds;

        public bool HitTest(Point p) => bounds.Contains(p);

        public bool Equals(ICustomDrawOperation? other) => false;

        public void Dispose()
        {
        }

        public void Render(ImmediateDrawingContext context)
        {
            var feature = context.TryGetFeature(typeof(ISkiaSharpApiLeaseFeature)) as ISkiaSharpApiLeaseFeature;
            if (feature == null)
                return;

            using var lease = feature.Lease();
            owner.Draw(lease.SkCanvas, (float)bounds.Width, (float)bounds.Height);
        }
    }
}
