import z from "zod";
import type { LucideIcon } from "lucide-react";
import {
	Activity, AlertCircle, AlertTriangle, Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpDown, Ban,
	BarChart3, Bell, Bookmark, Building2, Calendar, Check, CheckCircle, CheckCircle2, ChevronDown, ChevronLeft,
	ChevronRight, ChevronUp, ChevronsLeft, ChevronsRight, ChevronsUpDown, Clock, Copy, CreditCard, Database,
	DollarSign, Download, Eraser, ExternalLink, Eye, EyeOff, FileText, Filter, Flag, Folder, FunctionSquare, Globe,
	GripVertical, Heart, HelpCircle, Home, Image, Inbox, Info, Key, LineChart, Link, Loader2, Lock, LogIn, LogOut,
	Mail, MapPin, Menu, Minus, Moon, MoreHorizontal, MoreVertical, Package, PanelLeft, Pencil, Phone, PieChart, Pin,
	Plus, Printer, Receipt, RefreshCw, Save, Search, Send, Settings, Share2, Shield, ShoppingCart, SlidersHorizontal,
	Sparkles, Star, Sun, Tag, Trash2, TrendingDown, TrendingUp, Truck, Undo2, Unlock, Upload, User, Users, X, XCircle,
	Zap,
} from "lucide-react";

// Named imports, never `import *`: a namespace import plus a run-time key ships all ~1800 lucide icons.
export const ICONS = {
	// Row & record actions
	Archive, Check, Copy, Download, ExternalLink, Pencil, Plus, Printer, Save, Send, Share2, Trash2, Undo2, Upload, X,
	// Navigation & disclosure
	ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsLeft,
	ChevronsRight, ChevronsUpDown, Home, Menu, MoreHorizontal, MoreVertical, PanelLeft,
	// Status & feedback
	AlertCircle, AlertTriangle, Ban, CheckCircle2, HelpCircle, Info, Loader2, XCircle,
	// Search, filter, sort, time
	ArrowUpDown, Calendar, Clock, Filter, RefreshCw, Search, SlidersHorizontal,
	// Data & domain
	Building2, CreditCard, DollarSign, FileText, Folder, Image, Link, Mail, MapPin, Package, Phone, Receipt,
	ShoppingCart, Tag, Truck, User, Users,
	// Metrics
	Activity, BarChart3, LineChart, PieChart, TrendingDown, TrendingUp,
	// Visibility & flags
	Bell, Bookmark, Eye, EyeOff, Flag, Heart, Lock, Pin, Star, Unlock,
	// App chrome
	Database, Globe, Key, LogIn, LogOut, Moon, Settings, Shield, Sparkles, Sun, Zap,
	// Used inside catalog components
	CheckCircle, Eraser, FunctionSquare, GripVertical, Inbox, Minus,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

const ICON_NAMES = Object.keys(ICONS).sort() as [IconName, ...IconName[]];

// `id` hoists the ~100 members into the prompt's shared types, listed once.
export const iconNameSchema = z.enum(ICON_NAMES).meta({ id: "IconName" });
