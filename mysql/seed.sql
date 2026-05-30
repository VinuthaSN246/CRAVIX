USE cravix;

-- Demo users (password hashes inserted by scripts/setup-mysql.mjs)
-- Admin: admin@gmail.com / admin123
-- Customer: john@gmail.com / password123

INSERT IGNORE INTO profiles (id, username, email, avatar_url, wallet_balance, is_admin, role, is_blocked) VALUES
('mock-admin-uuid-1111', 'System Admin', 'admin@gmail.com', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', 1000.00, 1, 'admin', 0),
('mock-customer-uuid-2222', 'John Doe', 'john@gmail.com', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop', 350.00, 0, 'customer', 0),
('mock-customer-uuid-3333', 'Sarah Connor', 'sarah@gmail.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', 120.50, 0, 'customer', 0);

INSERT IGNORE INTO restaurants (id, name, image_url) VALUES
('rest-1', 'Burger Queen', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'),
('rest-2', 'Pizzeria Napoli', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500'),
('rest-3', 'Sushi House', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500');

INSERT IGNORE INTO categories (id, name, is_enabled) VALUES
('cat-1', 'Burgers', 1),
('cat-2', 'Pizza', 1),
('cat-3', 'Sushi', 1),
('cat-4', 'Pasta', 1),
('cat-5', 'Salads', 1),
('cat-6', 'Desserts', 1);

INSERT IGNORE INTO dishes (id, name, description, price, image_url, rating, category, is_available, ingredients, nutrition) VALUES
('dish-1', 'Classic Cheeseburger', 'Premium beef patty, cheddar cheese, lettuce, tomato, special cravix sauce on brioche bun.', 12.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', 4.8, 'Burgers', 1, '["Beef Patty","Cheddar","Lettuce","Tomato","Cravix Sauce","Brioche Bun"]', '{"calories":650,"protein":"35g","carbs":"45g","fat":"28g"}'),
('dish-2', 'Truffle Mushroom Burger', 'Beef patty, Swiss cheese, sautéed wild mushrooms, truffle aioli.', 15.49, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500', 4.9, 'Burgers', 1, '["Beef Patty","Swiss Cheese","Mushrooms","Truffle Aioli"]', '{"calories":720,"protein":"38g","carbs":"42g","fat":"34g"}'),
('dish-3', 'Pepperoni Passion Pizza', 'Double pepperoni, mozzarella, signature tomato base, hot honey drizzle.', 16.99, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500', 4.7, 'Pizza', 1, '["Pepperoni","Mozzarella","Tomato Base","Hot Honey"]', '{"calories":880,"protein":"40g","carbs":"78g","fat":"32g"}'),
('dish-4', 'Truffle Burrata Margherita', 'Creamy burrata, fresh basil, cherry tomatoes, white truffle oil.', 18.99, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500', 4.9, 'Pizza', 1, '["Burrata","Basil","Cherry Tomatoes","Truffle Oil"]', '{"calories":790,"protein":"28g","carbs":"82g","fat":"26g"}'),
('dish-5', 'Dragon Sushi Roll', 'Eel and cucumber inside, avocado and unagi sauce outside.', 14.99, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500', 4.6, 'Sushi', 1, '["Eel","Cucumber","Avocado","Rice","Nori"]', '{"calories":420,"protein":"18g","carbs":"55g","fat":"12g"}'),
('dish-6', 'Salmon Nigiri Platter', '6 pieces of premium fresh Atlantic salmon over vinegared sushi rice.', 17.50, 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=500', 4.8, 'Sushi', 1, '["Atlantic Salmon","Sushi Rice","Wasabi"]', '{"calories":340,"protein":"24g","carbs":"40g","fat":"8g"}'),
('dish-7', 'Truffle Mushroom Tagliatelle', 'Fresh hand-rolled pasta, wild mushrooms, creamy white truffle butter sauce.', 19.99, 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500', 4.9, 'Pasta', 1, '["Tagliatelle","Mushrooms","Truffle Butter","Parmigiano"]', '{"calories":680,"protein":"22g","carbs":"70g","fat":"26g"}'),
('dish-8', 'Quinoa Avocado Crunch Salad', 'Organic quinoa, diced avocado, baby spinach, cucumber, edamame.', 11.49, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500', 4.5, 'Salads', 1, '["Quinoa","Avocado","Baby Spinach","Cucumber","Edamame"]', '{"calories":320,"protein":"10g","carbs":"28g","fat":"16g"}'),
('dish-9', 'Lava Chocolate Cake', 'Rich dark chocolate cake with molten center and vanilla ice cream.', 8.99, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500', 4.9, 'Desserts', 1, '["Dark Chocolate","Flour","Butter","Sugar","Vanilla Ice Cream"]', '{"calories":540,"protein":"6g","carbs":"62g","fat":"22g"}');
