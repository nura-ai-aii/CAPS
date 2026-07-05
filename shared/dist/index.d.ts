export type OrderStatus = 'Waiting' | 'Ready to Print' | 'Printing' | 'Printed' | 'Failed';
export interface PrintSettings {
    paperSize: string;
    colorMode: 'Color' | 'Black and White';
    copies: number;
    instructions: string;
}
export interface FileData {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
}
export interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    customerDetails?: string;
    settings: PrintSettings;
    files: FileData[];
    createdAt: string;
    updatedAt: string;
}
