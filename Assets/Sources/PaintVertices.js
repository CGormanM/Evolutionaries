using System;
using UnityEngine;
using System.Collections;
using System.Runtime.CompilerServices;
using Random = UnityEngine.Random;

public class MorphObject : MonoBehaviour {

    public enum FallOff { Gauss, Linear, Needle }

    public float radius = 1.0f;
    public float pull = 10.0f;
    public FallOff fallOff= FallOff.Gauss;
    public GameObject sphere;
    private bool initialised = false;

    public Color32 color;

    private MeshFilter unappliedMesh;
    private Vector3 centre;





    void  Update (){

        if (!initialised){
            initialise();
        }

        if (Input.GetMouseButton(0) || Input.GetMouseButton(1)){
            // Did we hit the surface?
            RaycastHit hit;
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            if (Physics.Raycast(ray, out hit))
            {
                MeshFilter filter = hit.collider.GetComponent<MeshFilter>();
                if (filter)
                {
                    // Don't update mesh collider every frame since physX
                    // does some heavy processing to optimize the collision mesh.
                    // So this is not fast enough for real time updating every frame
                    if (filter != unappliedMesh)
                    {
                        ApplyMeshCollider();
                        unappliedMesh = filter;
                    }

                    // Deform mesh
                    Vector3 relativePoint = filter.transform.InverseTransformPoint(hit.point);

                    if(Input.GetMouseButton(0))
                        DeformMesh(filter.mesh, relativePoint, pull * Time.deltaTime, radius, 1, centre);
                    if(Input.GetMouseButton(1))
                        DeformMesh(filter.mesh, relativePoint, pull * Time.deltaTime, radius, 0, centre);
                }
            }
        }
        if (Input.GetMouseButton(2))
        {
            VertsColor(sphere);
        }
    }

    void initialise()
    {
        centre = sphere.transform.position;
        VertsColor(sphere);
        initialised = true;
    }

    static float  LinearFalloff ( float distance  ,   float inRadius  ){
        return Mathf.Clamp01(1.0f - distance / inRadius);
    }

    static float  GaussFalloff ( float distance  ,   float inRadius  ){
        return Mathf.Clamp01 (Mathf.Pow (360.0f, -Mathf.Pow (distance / inRadius, 2.5f) - 0.01f));
    }

    static float NeedleFalloff ( float dist ,   float inRadius  ){
        return -(dist*dist) / (inRadius * inRadius) + 1.0f;
    }

    void  DeformMesh ( Mesh mesh ,   Vector3 position ,   float power ,   float inRadius ,   int mouse, Vector3 centre  ){
        Vector3[] vertices = mesh.vertices;
        Vector3[] normals = mesh.normals;
        float sqrRadius= inRadius * inRadius;
        Vector3 direction;

        // Calculate averaged normal of all surrounding vertices   
        Vector3 averageNormal= Vector3.zero;
        for (int i=0; i < vertices.Length; i++)
        {
            float sqrMagnitude= (vertices[i] - position).sqrMagnitude;
            // Early out if too far away
            if (sqrMagnitude > sqrRadius)
                continue;

            float distance= Mathf.Sqrt(sqrMagnitude);
            float falloff= LinearFalloff(distance, inRadius);
            averageNormal += falloff * normals[i];
        }
        averageNormal = averageNormal.normalized;

        // Deform vertices along averaged normal
        for (int i=0; i<vertices.Length; i++)
        {
            float sqrMagnitude = (vertices[i] - position).sqrMagnitude;
            // Early out if too far away
            if (sqrMagnitude > sqrRadius)
                continue;

            float distance = Mathf.Sqrt(sqrMagnitude);
            float fallOffValue;
            switch (fallOff)
            {
                case FallOff.Gauss:
                    fallOffValue = GaussFalloff(distance, inRadius);
                    break;
                case FallOff.Needle:
                    fallOffValue = NeedleFalloff(distance, inRadius);
                    break;
                default:
                    fallOffValue = LinearFalloff(distance, inRadius);
                    break;
            }


            if (mouse == 1)
                vertices[i] += averageNormal * fallOffValue * power;
            else
                vertices[i] -= averageNormal * fallOffValue * power;
        }

        mesh.vertices = vertices;
        mesh.RecalculateNormals();
        mesh.RecalculateBounds();
    }

    void  ApplyMeshCollider (){
        if (unappliedMesh && unappliedMesh.GetComponent<MeshCollider>())
        {
            unappliedMesh.GetComponent<MeshCollider>().sharedMesh = unappliedMesh.mesh;
        }
    }

    public void VertsColor(GameObject gameObject)
    {
        Mesh mesh = gameObject.GetComponent<MeshFilter>().mesh;
        Vector3 centre = gameObject.transform.position;
        int[] triangles = mesh.triangles;
        Vector3[] vertices = mesh.vertices;

        Vector3[] verticesModified = new Vector3[triangles.Length];
        int[] trianglesModified = new int[triangles.Length];
        Color32[] colors = new Color32[triangles.Length];

        Color32 currentColor = new Color32();
        int count = 0;

        for (int i = 0; i < trianglesModified.Length; i++)
        {
            // Makes every vertex unique
            verticesModified[i] = vertices[triangles[i]];
            trianglesModified[i] = i;
            // Every third vertex randomly chooses new color
            if (Vector3.Distance(verticesModified[i], centre) < 7.5)
            {

                count++;
            }



            if (i % 3 == 0)
            {
                currentColor = new Color(
                    0.0f,
                Random.Range(0.45f, .55f),
                0.0f,
                1.0f);
                count = 0;
            }

            colors[i] = currentColor;


        }
        // Applyes changes to mesh
        mesh.vertices = verticesModified;
        mesh.triangles = trianglesModified;
        mesh.colors32 = colors;
    }



}



var radius = 1.0;
var pull = 10.0;
private var unappliedMesh : MeshFilter;

enum FallOff { Gauss, Linear, Needle }
var fallOff = FallOff.Gauss;

static function LinearFalloff (distance : float , inRadius : float) {
	return Mathf.Clamp01(1.0 - distance / inRadius);
}

static function GaussFalloff (distance : float , inRadius : float) {
	return Mathf.Clamp01 (Mathf.Pow (360.0, -Mathf.Pow (distance / inRadius, 2.5) - 0.01));
}

function NeedleFalloff (dist : float, inRadius : float)
{
	return -(dist*dist) / (inRadius * inRadius) + 1.0;
}

function DeformMesh (mesh : Mesh, position : Vector3, power : float, inRadius : float)
{
	var vertices = mesh.vertices;
	var normals = mesh.normals;
	var sqrRadius = inRadius * inRadius;
	
	// Calculate averaged normal of all surrounding vertices	
	var averageNormal = Vector3.zero;
	for (var i=0;i<vertices.length;i++)
	{
		var sqrMagnitude = (vertices[i] - position).sqrMagnitude;
		// Early out if too far away
		if (sqrMagnitude > sqrRadius)
			continue;

		var distance = Mathf.Sqrt(sqrMagnitude);
		var falloff = LinearFalloff(distance, inRadius);
		averageNormal += falloff * normals[i];
	}
	averageNormal = averageNormal.normalized;
	
	// Deform vertices along averaged normal
	for (i=0;i<vertices.length;i++)
	{
		sqrMagnitude = (vertices[i] - position).sqrMagnitude;
		// Early out if too far away
		if (sqrMagnitude > sqrRadius)
			continue;

		distance = Mathf.Sqrt(sqrMagnitude);
		switch (fallOff)
		{
			case FallOff.Gauss:
				falloff = GaussFalloff(distance, inRadius);
				break;
			case FallOff.Needle:
				falloff = NeedleFalloff(distance, inRadius);
				break;
			default:
				falloff = LinearFalloff(distance, inRadius);
				break;
		}
		
		vertices[i] += averageNormal * falloff * power;
	}
	
	mesh.vertices = vertices;
	mesh.RecalculateNormals();
	mesh.RecalculateBounds();
}

function Update () {

	// When no button is pressed we update the mesh collider
	if (!Input.GetMouseButton (0))
	{
		// Apply collision mesh when we let go of button
		ApplyMeshCollider();
		return;
	}
		
		
	// Did we hit the surface?
	var hit : RaycastHit;
	var ray = Camera.main.ScreenPointToRay(Input.mousePosition);
	if (Physics.Raycast (ray, hit))
	{
		var filter : MeshFilter = hit.collider.GetComponent(MeshFilter);
		if (filter)
		{
			// Don't update mesh collider every frame since physX
			// does some heavy processing to optimize the collision mesh.
			// So this is not fast enough for real time updating every frame
			if (filter != unappliedMesh)
			{
				ApplyMeshCollider();
				unappliedMesh = filter;
			}
			
			// Deform mesh
			var relativePoint = filter.transform.InverseTransformPoint(hit.point);
			DeformMesh(filter.mesh, relativePoint, pull * Time.deltaTime, radius);
		}
	}
}

function ApplyMeshCollider () {
	if (unappliedMesh && unappliedMesh.GetComponent(MeshCollider)) {
		unappliedMesh.GetComponent(MeshCollider).mesh = unappliedMesh.mesh;
	}
	unappliedMesh = null;
}