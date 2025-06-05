/*
  # Create increase_available_spots function

  1. New Functions:
    - `increase_available_spots`: Función para incrementar el número de lugares disponibles en una sesión
*/

-- Create function to increase available spots in a session
CREATE OR REPLACE FUNCTION increase_available_spots(session_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE workshop_sessions
  SET available_spots = available_spots + 1
  WHERE id = session_id AND available_spots < capacity;
END;
$$ LANGUAGE plpgsql;
