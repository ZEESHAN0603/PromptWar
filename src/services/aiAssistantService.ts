import {
  AIMessage,
  EventModel,
  BudgetCategoryItem,
  TaskItem,
  VendorItem,
} from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export interface AIResponsePayload {
  reply: string;
  suggestedAction?: AIMessage['suggestedAction'];
  recommendations?: string[];
}

export async function processAIChat(
  query: string,
  event: EventModel,
  budgets: BudgetCategoryItem[],
  tasks: TaskItem[],
  vendors: VendorItem[]
): Promise<AIResponsePayload> {
  // Simulate natural brief latency for realism
  await new Promise((resolve) => setTimeout(resolve, 600));

  const q = query.toLowerCase();

  // 1. Expense reduction query
  if (q.includes('reduce') || q.includes('expense') || q.includes('cut budget') || q.includes('affordable')) {
    const totalAllocated = budgets.reduce((acc, b) => acc + b.allocated, 0);
    const decor = budgets.find((b) => b.name.toLowerCase().includes('decor'))?.allocated || 90000;
    const entertain = budgets.find((b) => b.name.toLowerCase().includes('entertain'))?.allocated || 45000;

    return {
      reply: `Here is a targeted 3-point strategy to reduce your ${formatCurrency(totalAllocated, event.currency)} budget by up to 15% without hurting guest hospitality:\n\n1. **Floral & Lighting Optimization**: Shift from imported florals to local seasonal marigold & tuberose with warm fairy light canopies. Potential savings: **${formatCurrency(Math.round(decor * 0.25), event.currency)}**.\n2. **Catering Menu Engineering**: Replace 2 heavy sit-down meat dishes with interactive live street-food counters (chaat/pasta) which guests love and reduce per-plate waste. Estimated savings: **~₹35,000**.\n3. **Entertainment Re-calibration**: Choose an acoustic dinner ensemble paired with DJ reception over multiple specialized brass bands. Potential savings: **${formatCurrency(Math.round(entertain * 0.3), event.currency)}**.\n\nWould you like me to run an adaptive re-allocation simulation?`,
      suggestedAction: {
        type: 'rebalance_budget',
        label: 'Open Adaptive Plan Simulation',
      },
      recommendations: [
        'How can I accommodate 50 additional guests?',
        'Compare my catering quotations',
        'What should I complete this week?',
      ],
    };
  }

  // 2. What should I complete this week / tasks
  if (q.includes('complete this week') || q.includes('urgent') || q.includes('task') || q.includes('deadline')) {
    const pendingTasks = tasks.filter((t) => t.status !== 'completed');
    const urgentTasks = pendingTasks.slice(0, 3);

    const taskListText = urgentTasks
      .map(
        (t, i) =>
          `${i + 1}. **${t.title}** (Due: ${formatDate(t.dueDate)} · Priority: *${t.priority}*) — ${t.description}`
      )
      .join('\n');

    return {
      reply: `Based on your timeline for **${formatDate(event.date)}**, here are the most critical tasks needing your attention:\n\n${taskListText}\n\nNotice that **Venue & Catering confirmations** act as dependencies for your decorator and music playlist. Locking these prevents scheduling bottlenecks.`,
      suggestedAction: {
        type: 'add_task',
        label: 'View All Tasks in Timeline',
      },
      recommendations: [
        'Compare my catering quotations',
        'Help me reduce my event expenses',
        'Simulate 250 guests & two weeks earlier',
      ],
    };
  }

  // 3. Catering quotation comparison
  if (q.includes('cater') || q.includes('quote') || q.includes('quotation') || q.includes('compare')) {
    const cateringVendors = vendors.filter((v) => v.serviceCategory === 'catering');

    return {
      reply: `I analyzed your **${cateringVendors.length} catering quotations** for ${event.expectedGuests} guests:\n\n• **Saffron Grand Gourmet** (₹2,50,000 / ~₹1,250 plate): Includes pure Jain preparation, 6 appetizers, eco-porcelain dinnerware, and 4.9★ rating. Highly recommended for family diversity.\n• **SpiceRoute Royal Banquets** (₹2,80,000 / ~₹1,400 plate): Includes wedding cake and dessert flambé station, but charges extra for dedicated Jain kitchen and GST.\n\n**Recommendation:** Saffron Grand offers better value (₹30,000 lower) and covers your Jain dietary priority without extra fees.`,
      suggestedAction: {
        type: 'compare_vendors',
        label: 'Open Vendor Quotation Comparison',
      },
      recommendations: [
        'Help me reduce my event expenses',
        'What should I complete this week?',
        'Suggest a better decoration theme',
      ],
    };
  }

  // 4. Accommodate 50 additional guests / adaptive scenario
  if (q.includes('50') || q.includes('additional guests') || q.includes('250') || q.includes('two weeks earlier') || q.includes('change date')) {
    return {
      reply: `Adding **50 guests** (expanding from ${event.expectedGuests} to 250) and advancing the date creates three immediate ripple effects:\n\n1. **Venue Capacity**: Royal Orchid Grand Lawns has a comfortable 250-guest capacity threshold. We need to verify seating table layouts (25 tables of 10).\n2. **Catering Allocation**: At ₹1,250/plate, 50 extra guests require approximately **+₹62,500**. If your total budget is constrained to ₹7,00,000, we must adjust decoration and contingency to fund catering.\n3. **Urgent Deadlines**: Moving the date forward brings 3 critical tasks into immediate one-week urgency.\n\nClick below to launch the **Adaptive Event Re-plan Review** to see the full impact report!`,
      suggestedAction: {
        type: 'replan',
        label: 'Review Adaptive Plan Impact',
        payload: {
          newBudget: 700000,
          newGuests: 250,
          newDate: '2026-11-14',
        },
      },
      recommendations: [
        'Help me reduce my event expenses',
        'Compare my catering quotations',
        'Suggest a better decoration theme',
      ],
    };
  }

  // 5. Suggest decoration theme
  if (q.includes('decor') || q.includes('theme') || q.includes('atmosphere') || q.includes('style')) {
    return {
      reply: `For your **${event.category}** celebration with **${event.preferences.atmosphere}**, here are two tailored theme concepts:\n\n1. **"Sunset Botanical Romance"** (Recommended):\n• Palette: Dusty rose, warm champagne gold, and deep forest green foliage.\n• Elements: Cascading white tuberose chandeliers, brass oil lamps, hanging filament fairy bulbs.\n• Estimated Budget: ₹85,000 (Fits your current ₹90,000 allocation).\n\n2. **"Contemporary Heritage Minimalist"**:\n• Palette: Ivory, earthen terracotta, and warm ochre accents.\n• Elements: Clay urns with marigold bouquets, woven cane screens, acoustic lounge.\n• Estimated Budget: ₹65,000 (Saves ₹25,000 for catering buffer).`,
      recommendations: [
        'Help me reduce my event expenses',
        'What should I complete this week?',
        'Compare my catering quotations',
      ],
    };
  }

  // General fallback response
  return {
    reply: `I have analyzed your **${event.name}** project. With a budget of **${formatCurrency(event.totalBudget, event.currency)}** and **${event.expectedGuests} guests**, your planning milestones are on track. You can ask me to evaluate vendor quotes, simulate budget trade-offs, or review timeline dependencies anytime.`,
    recommendations: [
      'Help me reduce my event expenses',
      'What should I complete this week?',
      'Compare my catering quotations',
      'Simulate 250 guests & two weeks earlier',
    ],
  };
}
