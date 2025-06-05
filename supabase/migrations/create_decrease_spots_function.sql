/*
  # Create decrease_available_spots function

  1. New Functions:
    - `decrease_available_spots`: Función para disminuir los lugares disponibles en una sesión de taller
*/

-- Create function to decrease available spots in a workshop session
CREATE OR REPLACE FUNCTION decrease_available_spots(session_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE workshop_sessions
  SET available_spots = available_spots - 1
  WHERE id = session_id AND available_spots > 0;
END;
$$ LANGUAGE plpgsql;
