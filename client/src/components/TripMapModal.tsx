import { useState, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { gpx as parseGpx } from "@tmcw/togeojson";
import { Upload, Map, RefreshCw, Loader2, Mountain, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";

interface TripMapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gpxData: string | null | undefined;
  onGpxUpload: (gpxContent: string) => Promise<void>;
}

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, bounds]);
  
  return null;
}

const TILE_LAYERS = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: "Street"
  },
  topo: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    name: "Topo"
  }
};

export function TripMapModal({ open, onOpenChange, gpxData, onGpxUpload }: TripMapModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [trailCoords, setTrailCoords] = useState<LatLngExpression[]>([]);
  const [bounds, setBounds] = useState<LatLngBoundsExpression | null>(null);
  const [mapType, setMapType] = useState<"osm" | "topo">("topo");
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (gpxData) {
      try {
        const parser = new DOMParser();
        const gpxDoc = parser.parseFromString(gpxData, "application/xml");
        const geoJson = parseGpx(gpxDoc);
        
        const coords: LatLngExpression[] = [];
        const allPoints: [number, number][] = [];
        
        geoJson.features.forEach((feature: any) => {
          if (feature.geometry.type === "LineString") {
            feature.geometry.coordinates.forEach((coord: number[]) => {
              coords.push([coord[1], coord[0]]);
              allPoints.push([coord[1], coord[0]]);
            });
          } else if (feature.geometry.type === "MultiLineString") {
            feature.geometry.coordinates.forEach((line: number[][]) => {
              line.forEach((coord: number[]) => {
                coords.push([coord[1], coord[0]]);
                allPoints.push([coord[1], coord[0]]);
              });
            });
          }
        });
        
        setTrailCoords(coords);
        
        if (allPoints.length > 0) {
          const lats = allPoints.map(p => p[0]);
          const lngs = allPoints.map(p => p[1]);
          setBounds([
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
          ]);
        }
      } catch (err) {
        console.error("Error parsing GPX:", err);
        toast({
          title: "Error",
          description: "Failed to parse GPX file",
          variant: "destructive"
        });
      }
    } else {
      setTrailCoords([]);
      setBounds(null);
    }
  }, [gpxData, toast]);

  useEffect(() => {
    setTilesLoaded(false);
  }, [mapType]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".gpx")) {
      toast({
        title: "Invalid file",
        description: "Please upload a GPX file",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const content = await file.text();
      await onGpxUpload(content);
      toast({
        title: "Trail uploaded",
        description: "Your trail map has been saved"
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Failed to upload GPX file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [onGpxUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  const currentTileLayer = TILE_LAYERS[mapType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              Trail Map
            </DialogTitle>
            <div className="flex items-center gap-2">
              {gpxData && (
                <>
                  <div className="flex rounded-md border border-border overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMapType("osm")}
                      className={`rounded-none px-3 h-8 ${mapType === "osm" ? "bg-primary text-white" : ""}`}
                      data-testid="button-map-street"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Street
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMapType("topo")}
                      className={`rounded-none px-3 h-8 ${mapType === "topo" ? "bg-primary text-white" : ""}`}
                      data-testid="button-map-topo"
                    >
                      <Mountain className="w-3 h-3 mr-1" />
                      Topo
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleReplaceClick}
                    disabled={isUploading}
                    data-testid="button-replace-gpx"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Replace GPX
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".gpx"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-gpx-file"
        />
        
        <div className="flex-1 min-h-0 p-4 pt-2">
          {!gpxData ? (
            <div
              className={`h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              data-testid="gpx-dropzone"
            >
              <Upload className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload GPX File</h3>
              <p className="text-muted-foreground text-sm mb-4 text-center px-4">
                Drag and drop a GPX file here, or click to browse
              </p>
              <Button 
                variant="outline" 
                onClick={handleReplaceClick}
                disabled={isUploading}
                data-testid="button-browse-gpx"
              >
                {isUploading ? "Uploading..." : "Browse Files"}
              </Button>
            </div>
          ) : (
            <div className="h-full rounded-xl overflow-hidden border border-border relative">
              {!tilesLoaded && (
                <div className="absolute inset-0 z-[1000] bg-background/80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading tiles...</span>
                  </div>
                </div>
              )}
              <MapContainer
                center={[0, 0]}
                zoom={13}
                className="h-full w-full"
                scrollWheelZoom={true}
              >
                <TileLayer
                  key={mapType}
                  attribution={currentTileLayer.attribution}
                  url={currentTileLayer.url}
                  eventHandlers={{
                    load: () => setTilesLoaded(true),
                    tileload: () => setTilesLoaded(true)
                  }}
                />
                {trailCoords.length > 0 && (
                  <Polyline 
                    positions={trailCoords} 
                    color="#e63946" 
                    weight={4}
                  />
                )}
                <FitBounds bounds={bounds} />
              </MapContainer>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
