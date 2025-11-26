export interface Strategy {
  id: string;
  name: string;
  shortSubtitle: string;
  longDescription: string;
  heroImageUrl: string;
  themeColor: string;
  icon: string;
}

export const STRATEGIES: Strategy[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    shortSubtitle: 'Standard healthy pattern',
    longDescription: `The Balanced strategy is designed for anyone looking to maintain a healthy lifestyle without extreme restrictions. This approach focuses on getting nutrients from all food groups in moderate amounts.

You'll enjoy a mix of carbohydrates, proteins, and fats that support your daily energy needs while keeping you satisfied. This is perfect if you want flexibility in your food choices while still working toward your weight goals.

Expect steady, sustainable progress with plenty of variety in your meals.`,
    heroImageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/strategy/balanced.jpg',
    themeColor: '#4CAF50',
    icon: '⚖️',
  },
  {
    id: 'high-satiety',
    name: 'High Satiety',
    shortSubtitle: 'Helps you feel full longer',
    longDescription: `The High Satiety strategy prioritizes foods that keep you feeling satisfied for hours. By focusing on high-fiber vegetables, lean proteins, and foods with low energy density, you naturally eat less without feeling deprived.

This approach is ideal if you struggle with hunger or find yourself snacking frequently. You'll learn to choose foods that provide maximum fullness with fewer calories.

Expect to feel more satisfied after meals and experience fewer cravings throughout the day.`,
    heroImageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/strategy/high-satiety.jpg',
    themeColor: '#FF9800',
    icon: '🥗',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean',
    shortSubtitle: 'Focus on natural foods and healthy fats',
    longDescription: `The Mediterranean strategy draws inspiration from traditional eating patterns in Mediterranean countries. This approach emphasizes whole grains, fresh vegetables, olive oil, fish, and moderate amounts of dairy.

Rich in healthy fats and antioxidants, this strategy supports both weight management and overall health. It's perfect if you enjoy flavorful, minimally processed foods and want a lifestyle approach rather than a restrictive diet.

Expect not just weight loss, but improved heart health, better energy, and a sustainable way of eating you can maintain for life.`,
    heroImageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/strategy/mediterranean.jpg',
    themeColor: '#2196F3',
    icon: '🫒',
  },
  {
    id: 'high-protein',
    name: 'High Protein',
    shortSubtitle: 'Preserve muscle while losing fat',
    longDescription: `The High Protein strategy increases your protein intake to 25-35% of total calories. Protein is highly satiating and helps preserve lean muscle mass during weight loss, keeping your metabolism strong.

This approach is ideal if you're active, do resistance training, or want to ensure you're losing fat rather than muscle. You'll focus on lean meats, fish, eggs, dairy, and plant-based protein sources.

Expect better muscle retention, reduced hunger, and potentially faster fat loss compared to lower protein approaches.`,
    heroImageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/strategy/high-protein.jpg',
    themeColor: '#E91E63',
    icon: '🍗',
  },
  {
    id: 'low-carb',
    name: 'Low Carb',
    shortSubtitle: 'Reduce carbs to control appetite',
    longDescription: `The Low Carb strategy limits carbohydrate intake to help stabilize blood sugar and reduce appetite. By cutting back on bread, pasta, rice, and sugars, you naturally consume fewer calories while feeling satisfied.

This approach works well if you notice that carbs make you hungrier or if you want to reduce insulin spikes. You'll eat plenty of vegetables, proteins, and healthy fats while limiting starchy and sugary foods.

Expect reduced cravings, stable energy throughout the day, and potentially rapid initial weight loss as your body adapts.`,
    heroImageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/strategy/low-carb.jpg',
    themeColor: '#9C27B0',
    icon: '🥑',
  },
  {
    id: 'low-net-carb',
    name: 'Low Net Carb',
    shortSubtitle: 'Focus on fiber-rich, low-impact carbs',
    longDescription: `The Low Net Carb strategy focuses on "net carbs" (total carbs minus fiber). This allows you to eat plenty of high-fiber vegetables while still keeping your digestible carb intake low.

Unlike strict low-carb diets, this approach encourages abundant vegetable intake for their fiber and nutrients. It's perfect if you want the benefits of low-carb eating while still enjoying generous portions of vegetables.

Expect excellent satiety, stable blood sugar, and the flexibility to eat large volumes of nutrient-dense foods.`,
    heroImageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/strategy/low-net-carb.jpg',
    themeColor: '#00BCD4',
    icon: '🥦',
  },
  {
    id: 'plant-based',
    name: 'Plant-Based',
    shortSubtitle: 'Whole foods from plants',
    longDescription: `The Plant-Based strategy centers your diet around vegetables, fruits, whole grains, legumes, nuts, and seeds. By focusing on minimally processed plant foods, you naturally reduce calorie density while maximizing nutrition.

This approach is ideal if you prefer vegetarian eating, care about environmental impact, or want to increase your intake of fiber and phytonutrients. You can include small amounts of animal products or go fully plant-based.

Expect high fiber intake, excellent nutrition, reduced inflammation, and sustainable weight loss from a naturally lower-calorie eating pattern.`,
    heroImageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/strategy/plant-based.jpg',
    themeColor: '#8BC34A',
    icon: '🌱',
  },
  {
    id: 'heart-healthy',
    name: 'Heart-Healthy',
    shortSubtitle: 'Support cardiovascular wellness',
    longDescription: `The Heart-Healthy strategy is designed to support cardiovascular health while promoting weight loss. This approach limits saturated fat and sodium while emphasizing foods rich in omega-3s, fiber, and potassium.

Based on dietary patterns shown to reduce heart disease risk, this strategy is perfect if you have concerns about blood pressure, cholesterol, or family history of heart disease. You'll focus on fish, nuts, whole grains, and plenty of fruits and vegetables.

Expect not just weight loss, but improvements in cholesterol levels, blood pressure, and overall heart health markers.`,
    heroImageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/strategy/heart-healthy.jpg',
    themeColor: '#F44336',
    icon: '❤️',
  },
];

export function getStrategyById(id: string | null): Strategy | null {
  if (!id) return null;
  return STRATEGIES.find(s => s.id === id) || null;
}

