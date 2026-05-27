import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Upload, Download, Search as SearchIcon, Filter, Columns3,
  Pencil, Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

type Vehicle = Tables<"vehicle_fitments">;

// ─── ALL YEARS 1900 → current year ───────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const ALL_YEARS: number[] = [];
for (let y = CURRENT_YEAR; y >= 1900; y--) ALL_YEARS.push(y);

// ─── COMPREHENSIVE MAKES + MODELS + SUBMODELS DATA ───────────────────────────
const VEHICLE_DATA: Record<string, Record<string, string[]>> = {
  "Acura": {
    "ILX": ["Base", "Premium", "Technology", "A-Spec"],
    "MDX": ["Base", "Technology", "Sport Hybrid", "A-Spec", "Advance", "Type S"],
    "NSX": ["Base", "Type S"],
    "RDX": ["Base", "Technology", "A-Spec", "Advance"],
    "RLX": ["Base", "Sport Hybrid", "Technology"],
    "TLX": ["Base", "Technology", "A-Spec", "Advance", "PMC Edition", "Type S"],
    "TSX": ["Base", "Special Edition", "Technology", "V6"],
    "ZDX": ["Base", "Technology"],
    "Integra": ["Base", "A-Spec", "A-Spec Technology"],
  },
  "Alfa Romeo": {
    "4C": ["Coupe", "Spider", "Launch Edition"],
    "Giulia": ["Base", "Sprint", "Ti", "Ti Sport", "Quadrifoglio"],
    "Giulietta": ["Sprint", "Distinctive", "Exclusive", "Veloce"],
    "GTV": ["1750", "2000", "V6"],
    "Stelvio": ["Base", "Sprint", "Ti", "Ti Sport", "Quadrifoglio"],
    "Tonale": ["Sprint", "Ti", "Veloce"],
  },
  "Aston Martin": {
    "DB11": ["V8", "V12", "AMR"],
    "DB9": ["Base", "GT", "Volante"],
    "DBS": ["Base", "Superleggera", "Volante"],
    "Vantage": ["Base", "AMR", "S", "V12"],
    "DBX": ["Base", "707"],
    "Rapide": ["Base", "S"],
  },
  "Audi": {
    "A3": ["Premium", "Premium Plus", "Prestige", "Sportback", "e-tron"],
    "A4": ["Premium", "Premium Plus", "Prestige", "allroad"],
    "A5": ["Premium", "Premium Plus", "Prestige", "Sportback", "Cabriolet"],
    "A6": ["Premium", "Premium Plus", "Prestige", "allroad"],
    "A7": ["Premium", "Premium Plus", "Prestige"],
    "A8": ["Base", "L", "L 60 TFSI"],
    "Q3": ["Premium", "Premium Plus", "Prestige"],
    "Q5": ["Premium", "Premium Plus", "Prestige", "Sportback", "e-tron"],
    "Q7": ["Premium", "Premium Plus", "Prestige"],
    "Q8": ["Premium", "Premium Plus", "Prestige", "e-tron"],
    "R8": ["V10", "V10 Plus", "V10 Performance", "Spyder"],
    "RS3": ["Base"],
    "RS5": ["Coupe", "Sportback"],
    "RS6": ["Avant"],
    "RS7": ["Base"],
    "S3": ["Premium", "Premium Plus", "Prestige"],
    "S4": ["Premium", "Premium Plus", "Prestige"],
    "S5": ["Premium", "Premium Plus", "Prestige", "Sportback"],
    "S6": ["Premium", "Premium Plus", "Prestige"],
    "S7": ["Premium", "Premium Plus", "Prestige"],
    "TT": ["Base", "S", "RS", "Roadster"],
    "e-tron": ["Premium", "Premium Plus", "Prestige", "Sportback", "GT"],
  },
  "Bentley": {
    "Bentayga": ["Base", "V8", "Speed", "EWB"],
    "Continental GT": ["Base", "V8", "Speed", "Convertible"],
    "Flying Spur": ["Base", "V8", "Speed"],
    "Mulsanne": ["Base", "Speed", "Extended Wheelbase"],
  },
  "BMW": {
    "1 Series": ["116i", "118i", "120i", "M135i"],
    "2 Series": ["228i", "230i", "M240i", "M2", "Gran Coupe"],
    "3 Series": ["320i", "330i", "330e", "340i", "M340i", "Gran Turismo"],
    "4 Series": ["430i", "440i", "M440i", "Gran Coupe", "Convertible", "M4"],
    "5 Series": ["530i", "540i", "545e", "550i", "M550i", "Gran Turismo"],
    "6 Series": ["640i", "650i", "M6", "Gran Coupe", "Convertible"],
    "7 Series": ["740i", "750i", "760i", "740e", "Alpina B7"],
    "8 Series": ["840i", "850i", "M8", "Gran Coupe", "Convertible"],
    "M2": ["Base", "Competition"],
    "M3": ["Base", "Competition", "CS"],
    "M4": ["Base", "Competition", "CSL", "Convertible"],
    "M5": ["Base", "Competition", "CS"],
    "M8": ["Base", "Competition", "Gran Coupe"],
    "X1": ["sDrive28i", "xDrive28i", "xDrive30e"],
    "X2": ["sDrive28i", "xDrive28i", "M35i"],
    "X3": ["sDrive30i", "xDrive30i", "xDrive30e", "M40i", "M"],
    "X4": ["xDrive30i", "M40i", "M"],
    "X5": ["sDrive40i", "xDrive40i", "xDrive50e", "M60i", "M"],
    "X6": ["sDrive40i", "xDrive40i", "M60i", "M"],
    "X7": ["xDrive40i", "xDrive50e", "M60i", "Alpina XB7"],
    "Z4": ["sDrive30i", "M40i"],
    "i3": ["Base", "s", "REx"],
    "i4": ["eDrive40", "M50"],
    "i7": ["xDrive60", "M70"],
    "iX": ["xDrive50", "M60"],
  },
  "Buick": {
    "Enclave": ["Base", "Preferred", "Essence", "Premium", "Avenir"],
    "Encore": ["Base", "Preferred", "Essence", "Premium", "Sport Touring"],
    "Encore GX": ["Base", "Preferred", "Select", "Essence", "ST"],
    "Envision": ["Base", "Preferred", "Essence", "Premium", "Avenir"],
    "LaCrosse": ["Base", "Preferred", "Essence", "Premium", "Avenir"],
    "Regal": ["Base", "Preferred", "Essence", "GS", "Sportback", "TourX"],
    "Verano": ["Base", "Convenience", "Leather", "Premium"],
  },
  "Cadillac": {
    "ATS": ["Base", "Luxury", "Performance", "Premium", "V"],
    "CT4": ["Base", "Luxury", "Premium", "Premium Luxury", "V", "Blackwing"],
    "CT5": ["Base", "Luxury", "Premium", "Premium Luxury", "V", "Blackwing"],
    "CT6": ["Base", "Luxury", "Premium Luxury", "Platinum", "V-Sport"],
    "Escalade": ["Base", "Luxury", "Premium Luxury", "Platinum", "ESV", "Sport"],
    "SRX": ["Base", "Luxury", "Performance", "Premium"],
    "XT4": ["Base", "Luxury", "Premium", "Premium Luxury", "Sport"],
    "XT5": ["Base", "Luxury", "Premium", "Premium Luxury", "Sport"],
    "XT6": ["Base", "Luxury", "Premium", "Premium Luxury", "Sport"],
    "LYRIQ": ["Luxury", "Sport", "Platinum"],
  },
  "Chevrolet": {
    "Blazer": ["L", "LS", "LT", "RS", "Premier", "SS", "EV"],
    "Camaro": ["LS", "LT", "LT1", "SS", "ZL1", "ZL1 1LE", "Convertible"],
    "Colorado": ["WT", "LT", "Z71", "ZR2", "Trail Boss"],
    "Corvette": ["Stingray", "Grand Sport", "Z06", "ZR1", "E-Ray"],
    "Equinox": ["LS", "LT", "RS", "Premier", "EV"],
    "Express": ["LS", "LT", "2500", "3500"],
    "Impala": ["LS", "LT", "Premier"],
    "Malibu": ["LS", "LT", "RS", "Premier"],
    "Silverado 1500": ["WT", "Custom", "LS", "Custom Trail Boss", "LT", "RST", "LT Trail Boss", "LTZ", "High Country", "ZR2"],
    "Silverado 2500HD": ["WT", "Custom", "LT", "LTZ", "High Country"],
    "Silverado 3500HD": ["WT", "Custom", "LT", "LTZ", "High Country"],
    "Suburban": ["LS", "LT", "RST", "Z71", "Premier", "High Country"],
    "Tahoe": ["LS", "LT", "RST", "Z71", "Premier", "High Country"],
    "Trailblazer": ["LS", "LT", "ACTIV", "RS", "LTZ"],
    "Traverse": ["LS", "LT", "RS", "Premier", "High Country"],
    "Trax": ["LS", "LT", "ACTIV", "RS"],
  },
  "Chrysler": {
    "300": ["Touring", "Touring L", "Limited", "S", "C", "300S"],
    "Pacifica": ["Touring", "Touring L", "Touring L Plus", "Limited", "Pinnacle", "Hybrid"],
    "Voyager": ["LX", "L"],
    "Sebring": ["LX", "Touring", "Limited"],
    "Town & Country": ["Touring", "Touring-L", "Limited", "S"],
  },
  "Dodge": {
    "Challenger": ["SXT", "GT", "R/T", "R/T Scat Pack", "SRT 392", "SRT Hellcat", "SRT Demon", "SRT Super Stock"],
    "Charger": ["SXT", "GT", "R/T", "Scat Pack", "SRT 392", "SRT Hellcat", "SRT Hellcat Redeye"],
    "Dart": ["SE", "SXT", "Aero", "GT", "R/T", "Limited", "Rallye"],
    "Durango": ["SXT", "GT", "Citadel", "R/T", "SRT 392", "Hellcat"],
    "Grand Caravan": ["SE", "SE Plus", "SXT", "GT"],
    "Journey": ["SE", "SXT", "Crossroad", "GT"],
    "Ram 1500": ["Tradesman", "SXT", "Big Horn", "Laramie", "Rebel", "Longhorn", "Limited", "TRX"],
  },
  "Ferrari": {
    "296": ["GTB", "GTS", "GT3"],
    "488": ["GTB", "Spider", "Pista", "Pista Spider"],
    "812": ["Superfast", "GTS", "Competizione", "Competizione A"],
    "California": ["Base", "T", "Handling Speciale"],
    "F8": ["Tributo", "Spider"],
    "GTC4Lusso": ["Base", "T"],
    "Portofino": ["Base", "M"],
    "Roma": ["Base", "Spider"],
    "SF90": ["Stradale", "Spider", "XX"],
  },
  "Fiat": {
    "124 Spider": ["Classica", "Lusso", "Abarth"],
    "500": ["Pop", "Sport", "Lounge", "Abarth", "Electric"],
    "500L": ["Pop", "Easy", "Trekking", "Lounge"],
    "500X": ["Pop", "Easy", "Trekking", "Lounge"],
  },
  "Ford": {
    "Bronco": ["Base", "Big Bend", "Black Diamond", "Outer Banks", "Badlands", "Wildtrak", "Everglades", "Raptor"],
    "Bronco Sport": ["Base", "Big Bend", "Outer Banks", "Badlands", "Heritage", "Heritage Limited"],
    "Edge": ["SE", "SEL", "Titanium", "ST", "ST-Line"],
    "Escape": ["S", "SE", "SEL", "Titanium", "PHEV"],
    "Expedition": ["XL", "XLT", "Limited", "Platinum", "Timberline", "MAX"],
    "Explorer": ["Base", "XLT", "Limited", "ST", "Platinum", "Timberline", "ST-Line", "King Ranch"],
    "F-150": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Raptor", "Raptor R", "Tremor"],
    "F-250 Super Duty": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Tremor"],
    "F-350 Super Duty": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited"],
    "Maverick": ["XL", "XLT", "Lariat", "Tremor"],
    "Mustang": ["EcoBoost", "EcoBoost Premium", "GT", "GT Premium", "Mach 1", "Shelby GT350", "Shelby GT500", "Dark Horse"],
    "Mustang Mach-E": ["Select", "Premium", "California Route 1", "GT"],
    "Ranger": ["XL", "XLT", "Lariat", "Tremor", "Raptor"],
    "Transit": ["XL", "XLT", "Custom", "Limited", "Connect"],
  },
  "Genesis": {
    "G70": ["Standard", "Advanced", "Sport", "Prestige"],
    "G80": ["Standard", "Advanced", "Sport", "Sport Prestige", "Electrified"],
    "G90": ["Premium", "Prestige"],
    "GV70": ["Standard", "Advanced", "Sport", "Prestige", "Electrified"],
    "GV80": ["Standard", "Advanced", "Prestige"],
  },
  "GMC": {
    "Acadia": ["SL", "SV", "SLE", "SLT", "AT4", "Denali"],
    "Canyon": ["WT", "SL", "SLE", "SLT", "AT4", "Denali"],
    "Envoy": ["SL", "SLE", "SLT", "XUV"],
    "Sierra 1500": ["Pro", "SLE", "SLT", "AT4", "Elevation", "Denali", "AT4X"],
    "Sierra 2500HD": ["Pro", "SLE", "SLT", "AT4", "Denali"],
    "Sierra 3500HD": ["Pro", "SLE", "SLT", "AT4", "Denali"],
    "Terrain": ["SL", "SV", "SLE", "SLT", "AT4", "Denali"],
    "Yukon": ["SL", "SLE", "SLT", "AT4", "Denali", "XL"],
  },
  "Honda": {
    "Accord": ["LX", "Sport", "Sport-L", "EX", "EX-L", "Touring", "Hybrid"],
    "Civic": ["LX", "Sport", "EX", "EX-L", "Touring", "Si", "Type R", "Hatchback"],
    "CR-V": ["LX", "EX", "EX-L", "Touring", "Sport", "Hybrid"],
    "CR-Z": ["Base", "EX", "EX-L"],
    "Element": ["LX", "EX", "SC"],
    "Fit": ["LX", "Sport", "EX", "EX-L"],
    "HR-V": ["LX", "Sport", "EX", "EX-L", "Touring"],
    "Insight": ["LX", "EX", "Touring"],
    "Odyssey": ["LX", "EX", "EX-L", "Touring", "Elite"],
    "Passport": ["Sport", "EX-L", "Touring", "Elite", "TrailSport"],
    "Pilot": ["LX", "Sport", "EX-L", "Touring", "Elite", "TrailSport", "Black Edition"],
    "Prologue": ["EX", "EX-L", "Touring", "Elite"],
    "Ridgeline": ["Sport", "RTL", "RTL-E", "Black Edition"],
  },
  "Hyundai": {
    "Accent": ["SE", "SEL", "Limited"],
    "Elantra": ["SE", "SEL", "N Line", "Limited", "N", "Hybrid"],
    "IONIQ 5": ["Standard Range RWD", "Standard Range AWD", "Long Range RWD", "Long Range AWD", "N"],
    "IONIQ 6": ["Standard Range RWD", "Standard Range AWD", "Long Range RWD", "Long Range AWD"],
    "Kona": ["SE", "SEL", "N Line", "Limited", "N", "Electric"],
    "Palisade": ["SE", "SEL", "Limited", "Calligraphy", "XRT"],
    "Santa Cruz": ["SE", "SEL", "SEL Premium", "Limited"],
    "Santa Fe": ["SE", "SEL", "XRT", "Limited", "Calligraphy", "Hybrid", "PHEV"],
    "Sonata": ["SE", "SEL", "SEL Plus", "N Line", "Limited", "Hybrid"],
    "Tucson": ["SE", "SEL", "N Line", "XRT", "Limited", "Hybrid", "PHEV"],
    "Venue": ["SE", "SEL", "Denim", "Limited"],
  },
  "Infiniti": {
    "Q50": ["Pure", "Luxe", "Sport", "Red Sport 400", "Sensory"],
    "Q60": ["Pure", "Luxe", "Sport", "Red Sport 400"],
    "Q70": ["3.7", "5.6", "Hybrid"],
    "QX50": ["Pure", "Luxe", "Sensory", "Autograph"],
    "QX55": ["Pure", "Luxe", "Sensory", "Autograph"],
    "QX60": ["Pure", "Luxe", "Sensory", "Autograph"],
    "QX80": ["Luxe", "Sensory", "Autograph"],
  },
  "Jaguar": {
    "E-PACE": ["S", "SE", "HSE", "R-Dynamic S", "R-Dynamic SE", "R-Dynamic HSE"],
    "F-PACE": ["S", "SE", "HSE", "R-Dynamic S", "R-Dynamic SE", "R-Dynamic HSE", "SVR"],
    "F-TYPE": ["Base", "R", "SVR", "R-Dynamic", "Coupe", "Convertible"],
    "I-PACE": ["S", "SE", "HSE", "EV400"],
    "XE": ["S", "SE", "HSE", "R-Dynamic"],
    "XF": ["S", "SE", "HSE", "R-Dynamic", "Sportbrake"],
    "XJ": ["XJ", "XJL", "Portfolio", "R-Sport", "Supercharged"],
  },
  "Jeep": {
    "Cherokee": ["Sport", "Latitude", "Trailhawk", "Limited", "Overland", "Summit", "High Altitude"],
    "Compass": ["Sport", "Latitude", "Trailhawk", "Limited", "High Altitude"],
    "Gladiator": ["Sport", "Sport S", "Overland", "Mojave", "Rubicon", "Willys"],
    "Grand Cherokee": ["Laredo", "Altitude", "Limited", "Trailhawk", "Overland", "Summit", "SRT", "Trackhawk", "4xe"],
    "Grand Cherokee L": ["Laredo", "Limited", "Overland", "Summit", "Summit Reserve"],
    "Grand Wagoneer": ["Series I", "Series II", "Series III"],
    "Renegade": ["Sport", "Latitude", "Trailhawk", "Limited", "High Altitude"],
    "Wagoneer": ["Series I", "Series II", "Series III"],
    "Wrangler": ["Sport", "Sport S", "Sahara", "Rubicon", "Willys", "4xe", "Rubicon 392"],
  },
  "Kia": {
    "Carnival": ["LX", "LX+", "EX", "SX", "SX Prestige"],
    "EV6": ["Light", "Wind", "GT-Line", "GT"],
    "EV9": ["Light", "Wind", "Land", "GT-Line"],
    "K5": ["LXS", "GT-Line", "EX", "GT"],
    "Niro": ["LX", "EX", "EX Premium", "Touring", "EV", "PHEV"],
    "Seltos": ["LX", "S", "EX", "SX"],
    "Sorento": ["LX", "S", "EX", "SX", "SX Prestige", "Hybrid", "PHEV", "X-Line"],
    "Soul": ["LX", "S", "GT-Line", "EX", "Turbo"],
    "Sportage": ["LX", "S", "EX", "SX Prestige", "Hybrid", "PHEV", "X-Line", "X-Pro"],
    "Stinger": ["Premium", "GT-Line", "GT1", "GT2"],
    "Telluride": ["LX", "S", "EX", "SX", "SX Prestige", "X-Pro", "X-Line"],
  },
  "Lamborghini": {
    "Aventador": ["LP700-4", "LP720-4", "LP750-4 SV", "S", "SVJ", "Ultimae"],
    "Huracan": ["LP610-4", "LP580-2", "Performante", "EVO", "STO", "Tecnica"],
    "Urus": ["Base", "S", "Performante"],
  },
  "Land Rover": {
    "Defender": ["90", "110", "130", "X", "X-Dynamic SE", "X-Dynamic HSE"],
    "Discovery": ["S", "SE", "HSE", "HSE Luxury", "First Edition"],
    "Discovery Sport": ["S", "SE", "HSE", "R-Dynamic SE", "R-Dynamic HSE"],
    "Range Rover": ["SE", "HSE", "HSE Silver", "Autobiography", "SV", "Sport"],
    "Range Rover Evoque": ["S", "SE", "HSE", "R-Dynamic SE", "R-Dynamic HSE"],
    "Range Rover Sport": ["S", "SE", "HSE", "Dynamic SE", "Dynamic HSE", "Autobiography"],
    "Range Rover Velar": ["S", "SE", "HSE", "R-Dynamic SE", "R-Dynamic HSE"],
  },
  "Lexus": {
    "ES": ["250", "300h", "350", "350 F Sport"],
    "GS": ["200t", "350", "350 F Sport", "450h", "F"],
    "GX": ["460", "460 Luxury", "460 Premium"],
    "IS": ["300", "300 AWD", "350", "350 F Sport", "500 F Sport"],
    "LC": ["500", "500h", "500 Convertible"],
    "LX": ["570", "600h"],
    "NX": ["200t", "300", "300h", "350", "350h", "450h+", "F Sport"],
    "RC": ["300", "350", "350 F Sport", "F"],
    "RX": ["300", "350", "350h", "350L", "450h", "450h+", "500h"],
    "TX": ["350", "350h", "500h"],
    "UX": ["200", "200 F Sport", "250h"],
  },
  "Lincoln": {
    "Aviator": ["Standard", "Reserve", "Black Label", "Grand Touring"],
    "Corsair": ["Standard", "Reserve", "Grand Touring"],
    "MKZ": ["Standard", "Reserve", "Black Label", "Hybrid"],
    "Nautilus": ["Standard", "Reserve", "Black Label"],
    "Navigator": ["Standard", "Reserve", "Black Label", "L"],
  },
  "Lotus": {
    "Eletre": ["Base", "S", "R"],
    "Emira": ["First Edition", "V6", "V6 First Edition"],
    "Evija": ["Base"],
    "Exige": ["S", "Sport 350", "Sport 390", "Cup 430"],
  },
  "Maserati": {
    "Ghibli": ["Base", "S", "S Q4", "Trofeo"],
    "GranTurismo": ["Sport", "MC", "Folgore"],
    "Grecale": ["GT", "Modena", "Trofeo", "Folgore"],
    "Levante": ["Base", "S", "GTS", "Trofeo"],
    "MC20": ["Base", "Cielo"],
    "Quattroporte": ["GTS", "S", "S Q4", "Trofeo"],
  },
  "Mazda": {
    "CX-3": ["Sport", "Touring", "Grand Touring"],
    "CX-5": ["Sport", "Touring", "Carbon Edition", "Grand Touring", "Grand Touring Reserve", "Signature"],
    "CX-50": ["2.5 S", "2.5 S Select", "2.5 S Preferred", "2.5 S Carbon Edition", "2.5 S Premium", "2.5 Turbo", "2.5 Turbo Premium Plus"],
    "CX-9": ["Sport", "Touring", "Carbon Edition", "Grand Touring", "Signature"],
    "CX-90": ["PHEV Premium", "PHEV Premium Plus", "MHEV Preferred", "MHEV Carbon Edition", "MHEV Premium"],
    "Mazda3": ["Sedan", "Hatchback", "Select", "Preferred", "Carbon Edition", "Premium", "Premium Plus", "Turbo"],
    "Mazda6": ["Sport", "Touring", "Carbon Edition", "Grand Touring", "Signature"],
    "MX-5 Miata": ["Sport", "Club", "Grand Touring", "RF Club", "RF Grand Touring"],
    "MX-30": ["Base", "R-EV"],
  },
  "McLaren": {
    "720S": ["Coupe", "Spider", "Performance"],
    "765LT": ["Coupe", "Spider"],
    "Artura": ["Base", "Performance"],
    "GT": ["Base"],
    "Senna": ["Base"],
  },
  "Mercedes-Benz": {
    "A-Class": ["A 220", "A 220 4MATIC", "AMG A 35"],
    "C-Class": ["C 300", "C 300 4MATIC", "AMG C 43", "AMG C 63", "Cabriolet", "Coupe"],
    "E-Class": ["E 350", "E 450", "E 450 4MATIC", "AMG E 53", "AMG E 63 S", "Cabriolet", "Wagon"],
    "G-Class": ["G 550", "AMG G 63"],
    "GLC": ["GLC 300", "GLC 300 4MATIC", "AMG GLC 43", "AMG GLC 63 S", "Coupe"],
    "GLE": ["GLE 350", "GLE 450", "GLE 580", "AMG GLE 53", "AMG GLE 63 S", "Coupe"],
    "GLS": ["GLS 450", "GLS 580", "AMG GLS 63", "Maybach GLS 600"],
    "S-Class": ["S 500", "S 580", "S 580 4MATIC", "AMG S 63", "Maybach S 680"],
    "SL-Class": ["SL 43 AMG", "SL 55 AMG", "SL 63 AMG"],
    "EQB": ["EQB 250+", "EQB 300 4MATIC", "EQB 350 4MATIC"],
    "EQC": ["EQC 400 4MATIC"],
    "EQE": ["EQE 350+", "EQE 350 4MATIC", "AMG EQE 43", "AMG EQE 53 4MATIC+"],
    "EQS": ["EQS 450+", "EQS 450 4MATIC", "AMG EQS 53 4MATIC+", "Maybach EQS 680"],
    "GLA": ["GLA 250", "GLA 250 4MATIC", "AMG GLA 35", "AMG GLA 45 S"],
    "GLB": ["GLB 250", "GLB 250 4MATIC", "AMG GLB 35"],
  },
  "MINI": {
    "Clubman": ["Cooper", "Cooper S", "John Cooper Works"],
    "Convertible": ["Cooper", "Cooper S", "John Cooper Works"],
    "Countryman": ["Cooper", "Cooper S", "Cooper SE ALL4", "John Cooper Works"],
    "Hardtop 2 Door": ["Cooper", "Cooper S", "John Cooper Works"],
    "Hardtop 4 Door": ["Cooper", "Cooper S", "John Cooper Works"],
    "Paceman": ["Cooper", "Cooper S", "Cooper S ALL4", "John Cooper Works"],
  },
  "Mitsubishi": {
    "Eclipse Cross": ["ES", "LE", "SE", "SEL", "SEL Premium"],
    "Galant": ["ES", "LS", "SE", "Ralliart"],
    "Mirage": ["ES", "LE", "SE", "GT", "G4"],
    "Outlander": ["ES", "SE", "SEL", "PHEV SE", "PHEV SEL", "PHEV GT"],
    "Outlander Sport": ["ES", "LE", "SE", "SP", "SEL", "GT"],
  },
  "Nissan": {
    "Altima": ["S", "SR", "SV", "SL", "Platinum", "SR VC-Turbo"],
    "Ariya": ["Engage", "Engage+", "Evolve+", "Platinum+", "e-4ORCE"],
    "Armada": ["S", "SV", "SL", "Platinum"],
    "Frontier": ["S", "SV", "Pro-4X", "Pro-X", "PRO-2X"],
    "Kicks": ["S", "SV", "SR"],
    "Leaf": ["S", "SV", "SV Plus", "SL Plus"],
    "Maxima": ["S", "SV", "SL", "Platinum", "40th Anniversary"],
    "Murano": ["S", "SV", "SL", "Platinum"],
    "Pathfinder": ["S", "SV", "SL", "Platinum", "Rock Creek"],
    "Rogue": ["S", "SV", "SL", "Platinum", "Sport"],
    "Sentra": ["S", "SV", "SR"],
    "Titan": ["S", "SV", "PRO-4X", "SL", "Platinum Reserve"],
    "Versa": ["S", "SV", "SR"],
    "Z": ["Sport", "Performance", "Proto Spec", "NISMO"],
  },
  "Porsche": {
    "718 Boxster": ["Base", "S", "T", "GTS 4.0", "Spyder"],
    "718 Cayman": ["Base", "S", "T", "GTS 4.0", "GT4", "GT4 RS"],
    "911": ["Carrera", "Carrera S", "Carrera 4", "Carrera 4S", "Targa 4", "Targa 4S", "Turbo", "Turbo S", "GT3", "GT3 RS", "GT2 RS", "Dakar"],
    "Cayenne": ["Base", "E-Hybrid", "S", "GTS", "Turbo", "Turbo E-Hybrid", "Turbo GT", "Coupe"],
    "Macan": ["Base", "S", "GTS", "Turbo", "Electric"],
    "Panamera": ["Base", "4", "4S", "GTS", "Turbo", "Turbo S", "4 E-Hybrid", "Turbo S E-Hybrid", "Sport Turismo"],
    "Taycan": ["Base", "4S", "GTS", "Turbo", "Turbo S", "Cross Turismo", "Sport Turismo"],
  },
  "Ram": {
    "1500": ["Tradesman", "Warlock", "Big Horn", "Laramie", "Rebel", "Lone Star", "Longhorn", "Limited", "TRX"],
    "2500": ["Tradesman", "Big Horn", "Laramie", "Power Wagon", "Longhorn", "Limited"],
    "3500": ["Tradesman", "Big Horn", "Laramie", "Longhorn", "Limited"],
    "ProMaster": ["1500", "2500", "3500"],
  },
  "Rolls-Royce": {
    "Cullinan": ["Base", "Black Badge"],
    "Dawn": ["Base", "Black Badge"],
    "Ghost": ["Base", "Extended", "Black Badge"],
    "Phantom": ["Base", "Extended", "EWB"],
    "Spectre": ["Base"],
    "Wraith": ["Base", "Black Badge"],
  },
  "Subaru": {
    "Ascent": ["Base", "Premium", "Limited", "Touring", "Onyx Edition"],
    "BRZ": ["Base", "Premium", "Limited", "tS"],
    "Crosstrek": ["Base", "Premium", "Sport", "Limited", "Wilderness", "Hybrid"],
    "Forester": ["Base", "Premium", "Sport", "Limited", "Touring", "Wilderness"],
    "Impreza": ["Base", "Premium", "Sport", "Limited"],
    "Legacy": ["Base", "Premium", "Sport", "Limited", "Touring XT"],
    "Outback": ["Base", "Premium", "Limited", "Limited XT", "Onyx Edition XT", "Touring XT", "Wilderness"],
    "Solterra": ["Base", "Premium", "Limited", "Touring"],
    "WRX": ["Base", "Premium", "Limited", "GT", "STI", "STI S209"],
  },
  "Tesla": {
    "Cybertruck": ["Foundation Series", "All-Wheel Drive", "Cyberbeast"],
    "Model 3": ["Standard Range", "Long Range", "Performance", "RWD", "Long Range AWD"],
    "Model S": ["Long Range", "Plaid"],
    "Model X": ["Long Range", "Plaid"],
    "Model Y": ["Standard Range", "Long Range", "Performance", "RWD", "Long Range AWD"],
    "Roadster": ["Base", "Founder Series"],
    "Semi": ["500 Mile"],
  },
  "Toyota": {
    "4Runner": ["SR5", "TRD Sport", "TRD Off-Road", "TRD Off-Road Premium", "Limited", "TRD Pro", "40th Anniversary"],
    "Avalon": ["XLE", "XSE", "XLE Premium", "Limited", "TRD", "Hybrid"],
    "bZ4X": ["XLE", "Limited"],
    "Camry": ["LE", "SE", "XSE", "XLE", "TRD", "XSE V6", "XLE V6", "Hybrid"],
    "C-HR": ["LE", "XLE", "Limited"],
    "Corolla": ["LE", "SE", "XSE", "XLE", "Apex Edition", "Hybrid", "Cross"],
    "Crown": ["XLE", "Limited", "Platinum"],
    "GR86": ["Base", "Premium"],
    "GR Corolla": ["Core", "Circuit Edition", "Morizo Edition"],
    "GR Supra": ["2.0", "3.0", "3.0 Premium", "A91 Edition"],
    "Highlander": ["LE", "XLE", "XSE", "Limited", "Platinum", "Hybrid", "Bronze Edition"],
    "Land Cruiser": ["1958", "Base", "First Edition"],
    "Mirai": ["XLE", "Limited"],
    "Prius": ["LE", "XLE", "Limited", "Prime SE", "Prime XSE", "Prime XSE Premium"],
    "RAV4": ["LE", "XLE", "XLE Premium", "TRD Off-Road", "Adventure", "Limited", "Hybrid", "Prime", "XSE Hybrid"],
    "Sequoia": ["SR5", "TRD Sport", "Limited", "Platinum", "TRD Pro", "Capstone"],
    "Sienna": ["LE", "XSE", "XLE", "Limited", "Platinum"],
    "Tacoma": ["SR", "SR5", "TRD Sport", "TRD Off-Road", "Limited", "TRD Pro", "Trail Edition", "Trailhunter"],
    "Tundra": ["SR", "SR5", "Limited", "Platinum", "1794 Edition", "TRD Pro", "Capstone", "i-FORCE MAX"],
    "Venza": ["LE", "XLE", "Limited"],
  },
  "Volkswagen": {
    "Arteon": ["SE", "SEL", "SEL Premium", "SEL R-Line"],
    "Atlas": ["S", "SE", "SE with Technology", "SEL", "SEL Premium", "Cross Sport"],
    "Golf": ["S", "SE", "SEL", "GTI S", "GTI SE", "GTI Autobahn", "R"],
    "ID.4": ["Standard", "Pro", "Pro S", "AWD Pro", "AWD Pro S"],
    "Jetta": ["S", "Sport", "SE", "SEL", "GLI S", "GLI Autobahn"],
    "Passat": ["S", "SE", "SE Business", "SEL", "SEL Premium", "R-Line"],
    "Taos": ["S", "SE", "SEL"],
    "Tiguan": ["S", "SE", "SE R-Line", "SEL", "SEL R-Line", "SEL Premium"],
  },
  "Volvo": {
    "C40 Recharge": ["Base", "Twin"],
    "S60": ["Momentum", "R-Design", "Inscription", "T8 Recharge", "Polestar"],
    "S90": ["Momentum", "R-Design", "Inscription", "T8 Recharge"],
    "V60": ["Momentum", "R-Design", "Inscription", "T8 Recharge", "Cross Country"],
    "V90": ["Momentum", "Inscription", "T8 Recharge", "Cross Country"],
    "XC40": ["Momentum", "R-Design", "Inscription", "Recharge", "Recharge Twin"],
    "XC60": ["Momentum", "R-Design", "Inscription", "T8 Recharge", "Polestar"],
    "XC90": ["Momentum", "R-Design", "Inscription", "T8 Recharge", "Excellence"],
  },
};

const ALL_MAKES = Object.keys(VEHICLE_DATA).sort();

const getModels = (make: string) =>
  make && make !== "all" && VEHICLE_DATA[make]
    ? Object.keys(VEHICLE_DATA[make]).sort()
    : [];

const getSubmodels = (make: string, model: string) =>
  make && make !== "all" && model && model !== "all" && VEHICLE_DATA[make]?.[model]
    ? VEHICLE_DATA[make][model]
    : [];

// ─── TABLE COLUMNS ────────────────────────────────────────────────────────────
const ALL_COLUMNS = [
  { key: "year",       label: "Year" },
  { key: "make",       label: "Make" },
  { key: "model",      label: "Model" },
  { key: "submodel",   label: "Submodel" },
  { key: "fg_fmk",     label: "FG FMK" },
  { key: "region",     label: "Region" },
  { key: "drive_type", label: "Drive Type" },
  { key: "body_type",  label: "Body Type" },
] as const;

const emptyForm: TablesInsert<"vehicle_fitments"> = {
  year: CURRENT_YEAR,
  make: "",
  model: "",
  submodel: "",
  fg_fmk: "",
  region: "United States",
  drive_type: "",
  body_type: "",
};

// ─── CSV PARSER ───────────────────────────────────────────────────────────────
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = []; let val = ""; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { val += '"'; i++; }
      else if (c === '"') inQ = false;
      else val += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { cur.push(val); val = ""; }
      else if (c === "\n" || c === "\r") {
        if (val.length || cur.length) { cur.push(val); rows.push(cur); cur = []; val = ""; }
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else val += c;
    }
  }
  if (val.length || cur.length) { cur.push(val); rows.push(cur); }
  return rows;
}

const pick = (row: Record<string, string>, ...keys: string[]) => {
  for (const k of keys) {
    const found = Object.keys(row).find((rk) => rk.toLowerCase() === k.toLowerCase());
    if (found && row[found] != null && row[found] !== "") return row[found];
  }
  return "";
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function VehicleFitment() {
  const [dbRows, setDbRows] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [make, setMake] = useState("all");
  const [model, setModel] = useState("all");
  const [submodel, setSubmodel] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  // Table columns
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, true]))
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Dialog
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<TablesInsert<"vehicle_fitments">>(emptyForm);
  const [formModels, setFormModels] = useState<string[]>([]);
  const [formSubmodels, setFormSubmodels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importBusy, setImportBusy] = useState(false);

  // ── Data load ────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const { data, error, count } = await supabase
      .from("vehicle_fitments")
      .select("*", { count: "exact" })
      .order("year", { ascending: false })
      .limit(5000);
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    setDbRows(data ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Derived filter options from DB rows ──────────────────────────────────
  const dbYears = useMemo(() =>
    Array.from(new Set(dbRows.map((r) => r.year))).sort((a, b) => b - a),
    [dbRows]);

  // When filter make/model changes, get submodel options from static data
  const filterModels = useMemo(() => getModels(make), [make]);
  const filterSubmodels = useMemo(() => getSubmodels(make, model), [make, model]);

  // ── Filtered rows ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dbRows.filter((r) => {
      if (year !== "all" && r.year !== Number(year)) return false;
      if (make !== "all" && r.make !== make) return false;
      if (model !== "all" && r.model !== model) return false;
      if (submodel !== "all" && r.submodel !== submodel) return false;
      if (!q) return true;
      return [r.year, r.make, r.model, r.submodel, r.fg_fmk, r.region, r.drive_type, r.body_type]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [dbRows, search, year, make, model, submodel]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [search, year, make, model, submodel, pageSize]);

  const visibleCols = ALL_COLUMNS.filter((c) => visible[c.key]);

  const resetFilters = () => {
    setSearch(""); setYear("all"); setMake("all"); setModel("all"); setSubmodel("all");
  };

  // ── Form helpers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormModels([]);
    setFormSubmodels([]);
    setAddOpen(true);
  };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    const models = getModels(v.make);
    const submodels = getSubmodels(v.make, v.model);
    setFormModels(models);
    setFormSubmodels(submodels);
    setForm({
      year: v.year, make: v.make, model: v.model,
      submodel: v.submodel ?? "", fg_fmk: v.fg_fmk ?? "",
      region: v.region ?? "United States",
      drive_type: v.drive_type ?? "", body_type: v.body_type ?? "",
    });
    setAddOpen(true);
  };

  const handleFormMakeChange = (val: string) => {
    setForm((f) => ({ ...f, make: val, model: "", submodel: "" }));
    setFormModels(getModels(val));
    setFormSubmodels([]);
  };

  const handleFormModelChange = (val: string) => {
    setForm((f) => ({ ...f, model: val, submodel: "" }));
    setFormSubmodels(getSubmodels(form.make ?? "", val));
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = async () => {
    if (!form.make || !form.model || !form.year) {
      toast({ title: "Missing fields", description: "Year, Make and Model are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = { ...form, year: Number(form.year) };
    const res = editing
      ? await supabase.from("vehicle_fitments").update(payload).eq("id", editing.id)
      : await supabase.from("vehicle_fitments").insert(payload);
    setSaving(false);
    if (res.error) {
      toast({ title: "Save failed", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Vehicle updated" : "Vehicle added" });
    setAddOpen(false); setEditing(null); load();
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const remove = async (id: string) => {
    const { error } = await supabase.from("vehicle_fitments").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    setSelected((s) => { const n = new Set(s); n.delete(id); return n; });
    toast({ title: "Vehicle deleted" });
    load();
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("vehicle_fitments").delete().in("id", ids);
    if (error) return toast({ title: "Bulk delete failed", description: error.message, variant: "destructive" });
    toast({ title: `Deleted ${ids.length} vehicles` });
    setSelected(new Set()); load();
  };

  // ── Selection ─────────────────────────────────────────────────────────────
  const toggleRow = (id: string) =>
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    const ids = pageRows.map((r) => r.id);
    const all = ids.every((i) => selected.has(i));
    setSelected((s) => {
      const n = new Set(s);
      if (all) ids.forEach((i) => n.delete(i)); else ids.forEach((i) => n.add(i));
      return n;
    });
  };

  // ── Export CSV ───────────────────────────────────────────────────────────
  const exportCsv = () => {
    const cols = visibleCols.map((c) => c.key);
    const header = visibleCols.map((c) => c.label).join(",");
    const body = filtered.map((r) =>
      cols.map((k) => {
        const v = (r as Record<string, unknown>)[k];
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(",")
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vehicle-fitments-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import CSV ───────────────────────────────────────────────────────────
  const importCsv = async (file: File) => {
    setImportBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error("CSV must have a header row and at least one data row");
      const headers = rows[0].map((h) => h.trim());
      const payload: TablesInsert<"vehicle_fitments">[] = [];
      for (let i = 1; i < rows.length; i++) {
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => (obj[h] = (rows[i][idx] ?? "").trim()));
        const yr = parseInt(pick(obj, "year"), 10);
        const mk = pick(obj, "make");
        const md = pick(obj, "model");
        if (!yr || !mk || !md) continue;
        payload.push({
          year: yr, make: mk, model: md,
          submodel: pick(obj, "submodel", "sub_model", "trim") || null,
          fg_fmk: pick(obj, "fg_fmk", "fg fmk", "fgfmk") || null,
          region: pick(obj, "region") || "United States",
          drive_type: pick(obj, "drive_type", "drive type", "drivetype") || null,
          body_type: pick(obj, "body_type", "body type", "bodytype") || null,
        });
      }
      if (!payload.length) throw new Error("No valid rows found");
      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await supabase.from("vehicle_fitments").insert(payload.slice(i, i + 500));
        if (error) throw error;
      }
      toast({ title: `Imported ${payload.length} vehicles` });
      load();
    } catch (e) {
      toast({ title: "Import failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setImportBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const uniqueMakes = new Set(dbRows.map((r) => r.make)).size;
  const uniqueModels = new Set(dbRows.map((r) => r.model)).size;
  const stats = [
    { label: "Total Vehicles",   value: totalCount.toLocaleString(), sub: "Total in database" },
    { label: "Makes",            value: uniqueMakes,                  sub: "Unique makes" },
    { label: "Models",           value: uniqueModels,                 sub: "Unique models" },
    {
      label: "Filtered Results",
      value: filtered.length === dbRows.length ? "All" : filtered.length.toLocaleString(),
      sub: filtered.length === dbRows.length ? "No filters applied" : "Matching current filters",
    },
  ];

  const activeFilters = [year, make, model, submodel].filter((v) => v !== "all").length + (search ? 1 : 0);

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Vehicle Fitment</h1>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importBusy}>
            <Upload className="w-4 h-4 mr-2" />
            {importBusy ? "Importing..." : "Import Vehicles"}
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" /> Add Vehicle
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-sm text-muted-foreground">{s.label}</div>
            <div className="text-3xl font-bold mt-1">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h2 className="font-semibold">Filters</h2>
          {activeFilters > 0 && <Badge variant="secondary">{activeFilters} active</Badge>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search year, make, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Year filter — 1900 to current year */}
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger><SelectValue placeholder="All Years" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Years</SelectItem>
              {/* First show years that exist in DB (highlighted) */}
              {dbYears.map((y) => (
                <SelectItem key={`db-${y}`} value={String(y)}>
                  {y} ✓
                </SelectItem>
              ))}
              {/* Then show all years 1900–now not already listed */}
              {ALL_YEARS.filter((y) => !dbYears.includes(y)).map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Make filter — all real makes */}
          <Select value={make} onValueChange={(v) => { setMake(v); setModel("all"); setSubmodel("all"); }}>
            <SelectTrigger><SelectValue placeholder="All Makes" /></SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Makes</SelectItem>
              {ALL_MAKES.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Model filter — depends on selected make */}
          <Select
            value={model}
            onValueChange={(v) => { setModel(v); setSubmodel("all"); }}
            disabled={make === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder={make === "all" ? "Select Make First" : "All Models"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Models</SelectItem>
              {filterModels.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Submodel filter — depends on selected make + model */}
          <Select
            value={submodel}
            onValueChange={setSubmodel}
            disabled={model === "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder={model === "all" ? "Select Model First" : "All Submodels"} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">All Submodels</SelectItem>
              {filterSubmodels.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button>
        )}
      </Card>

      {/* ── Bulk actions ── */}
      {selected.size > 0 && (
        <Card className="p-3 flex items-center gap-3 bg-muted/40">
          <span className="text-sm">{selected.size} selected</span>
          <Button size="sm" variant="destructive" onClick={bulkDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </Card>
      )}

      {/* ── Table ── */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Vehicles ({filtered.length.toLocaleString()})</h2>
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, filtered.length)} of {filtered.length.toLocaleString()} vehicles
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">Columns:</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="w-4 h-4 mr-2" /> Select Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_COLUMNS.map((c) => (
                  <DropdownMenuCheckboxItem
                    key={c.key} checked={visible[c.key]}
                    onCheckedChange={(v) => setVisible((s) => ({ ...s, [c.key]: !!v }))}
                    onSelect={(e) => e.preventDefault()}
                  >
                    {c.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-muted-foreground">View Results:</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[25, 50, 100, 200].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                {visibleCols.map((c) => <TableHead key={c.key}>{c.label}</TableHead>)}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={visibleCols.length + 2} className="text-center text-muted-foreground py-10">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleCols.length + 2} className="text-center text-muted-foreground py-10">
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : pageRows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <Checkbox checked={selected.has(v.id)} onCheckedChange={() => toggleRow(v.id)} />
                  </TableCell>
                  {visibleCols.map((c) => {
                    const val = (v as Record<string, unknown>)[c.key];
                    if (c.key === "submodel" && val)
                      return <TableCell key={c.key}><Badge variant="outline">{String(val)}</Badge></TableCell>;
                    if (c.key === "region" && val)
                      return <TableCell key={c.key}><Badge variant="secondary">{String(val)}</Badge></TableCell>;
                    return (
                      <TableCell key={c.key} className={c.key === "make" ? "font-medium" : ""}>
                        {val == null || val === ""
                          ? <span className="text-muted-foreground">N/A</span>
                          : String(val)}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="outline" onClick={() => openEdit(v)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => remove(v.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">

            {/* Year — dropdown 1900 to current year */}
            <div className="space-y-2">
              <Label>Year *</Label>
              <Select
                value={String(form.year)}
                onValueChange={(v) => setForm((f) => ({ ...f, year: Number(v) }))}
              >
                <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {ALL_YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Make — all makes */}
            <div className="space-y-2">
              <Label>Make *</Label>
              <Select value={form.make} onValueChange={handleFormMakeChange}>
                <SelectTrigger><SelectValue placeholder="Select Make" /></SelectTrigger>
                <SelectContent className="max-h-64">
                  {ALL_MAKES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model — depends on make */}
            <div className="space-y-2">
              <Label>Model *</Label>
              {formModels.length > 0 ? (
                <Select value={form.model} onValueChange={handleFormModelChange}>
                  <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {formModels.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.model}
                  placeholder="Enter model name"
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                />
              )}
            </div>

            {/* Submodel — depends on make + model */}
            <div className="space-y-2">
              <Label>Submodel / Trim</Label>
              {formSubmodels.length > 0 ? (
                <Select
                  value={form.submodel ?? ""}
                  onValueChange={(v) => setForm((f) => ({ ...f, submodel: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select Submodel" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="">None</SelectItem>
                    {formSubmodels.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.submodel ?? ""}
                  placeholder="e.g. Base, Sport, Limited"
                  onChange={(e) => setForm((f) => ({ ...f, submodel: e.target.value }))}
                />
              )}
            </div>

            {/* FG FMK */}
            <div className="space-y-2">
              <Label>FG FMK</Label>
              <Input
                value={form.fg_fmk ?? ""}
                placeholder="e.g. P215/55R17"
                onChange={(e) => setForm((f) => ({ ...f, fg_fmk: e.target.value }))}
              />
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                value={form.region ?? "United States"}
                onValueChange={(v) => setForm((f) => ({ ...f, region: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["United States", "Canada", "Mexico", "Europe", "Asia", "Australia", "Other"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drive Type */}
            <div className="space-y-2">
              <Label>Drive Type</Label>
              <Select
                value={form.drive_type ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, drive_type: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select Drive Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unknown</SelectItem>
                  <SelectItem value="FWD">FWD — Front-Wheel Drive</SelectItem>
                  <SelectItem value="RWD">RWD — Rear-Wheel Drive</SelectItem>
                  <SelectItem value="AWD">AWD — All-Wheel Drive</SelectItem>
                  <SelectItem value="4WD">4WD — Four-Wheel Drive</SelectItem>
                  <SelectItem value="4x4">4x4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Body Type */}
            <div className="space-y-2">
              <Label>Body Type</Label>
              <Select
                value={form.body_type ?? ""}
                onValueChange={(v) => setForm((f) => ({ ...f, body_type: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select Body Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unknown</SelectItem>
                  <SelectItem value="Sedan">Sedan</SelectItem>
                  <SelectItem value="Coupe">Coupe</SelectItem>
                  <SelectItem value="Hatchback">Hatchback</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                  <SelectItem value="Crossover">Crossover</SelectItem>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="Van">Van</SelectItem>
                  <SelectItem value="Minivan">Minivan</SelectItem>
                  <SelectItem value="Convertible">Convertible</SelectItem>
                  <SelectItem value="Wagon">Wagon</SelectItem>
                  <SelectItem value="Pickup">Pickup</SelectItem>
                  <SelectItem value="Sports Car">Sports Car</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : editing ? "Update Vehicle" : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
