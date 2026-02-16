# Chat Component System

This is a component-based chat interface similar to Notion's AI, where AI responses can render structured components instead of just text.

## Architecture

### Component Mapper
The `ComponentMapper` handles rendering different component types based on the message `type` field.

### Supported Component Types

1. **Text** - Plain text message (default)
2. **Appointment** - Single appointment card
3. **Appointment List** - List of appointments with title, description, date, time, status
4. **Property** - Single property card (buy/rent)
5. **Property List** - List of properties
6. **Service** - Single service card
7. **Service List** - List of services
8. **Image** - Image preview
9. **Document** - PDF/document download card
10. **Coupon** - Discount coupon card

## API Integration

### Request Format
```typescript
POST /api/chat
{
  "message": "عرض مواعيدي",
  "model": "standard" | "pro",
  "conversationId": null
}
```

### Response Format
```typescript
{
  "content": "إليك مواعيدك القادمة:",
  "type": "appointment-list",
  "data": [
    {
      "title": "زيارة عقار",
      "description": "زيارة عقار في حي الملقا",
      "date": "2024-01-15",
      "time": "04:00 م",
      "status": "confirmed"
    }
  ]
}
```

## Data Structures

### Appointment
```typescript
{
  title: string;
  description?: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "cancelled";
}
```

### Property
```typescript
{
  id?: string;
  title: string;
  description?: string;
  location: string;
  price: string;
  type: "buy" | "rent";
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  image?: string;
}
```

### Service
```typescript
{
  id?: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
}
```

## Usage

1. Copy `app/api/chat/route.example.ts` to `app/api/chat/route.ts`
2. Implement your AI/LLM integration
3. Return responses in the expected format
4. Components will automatically render based on the `type` field

## File Structure

- `chat-interface.tsx` - Main chat container
- `chat-bubble.tsx` - Message bubble component
- `chat-input.tsx` - Input component
- `component-mapper.tsx` - Component type mapper
- `chat-data-views.tsx` - All data component views
- `types.ts` - TypeScript type definitions
- `welcome-screen.tsx` - Welcome screen with suggestions


